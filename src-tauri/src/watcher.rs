//! File-change watcher for Operator workspaces.
//!
//! # Design
//!
//! This module is a native Rust port of `docs/references/spotlighter.sh`.
//! The shell script used `watchexec` to watch a workspace directory and
//! sync changes to a "conductor root path" via checkpoints.  Here we:
//!
//! 1. Use the `notify` + `notify-debouncer-mini` crates to watch a worktree.
//! 2. Debounce rapid file-system events (default: 300 ms).
//! 3. Filter out noise from `.git/` internals and `.context/`.
//! 4. Emit a `git_diff_updated` Tauri event to the frontend so the diff
//!    panel refreshes in real time.
//! 5. Optionally auto-save a checkpoint after each stable change burst
//!    (disabled by default; enable via `WatcherConfig::auto_checkpoint`).
//!
//! # Spotlight mirroring (future)
//!
//! The original `spotlighter.sh` also restored the saved checkpoint into a
//! separate "root path" so two workspace directories stayed in sync.  This
//! is useful for Conductor's shadow-workspace model.  The infrastructure is
//! wired in (`mirror_path` field), but the restore step is a TODO pending
//! the workspace-manager integration.
//!
//! # Usage
//!
//! ```rust
//! let watcher = WorkspaceWatcher::start(WatcherConfig {
//!     workspace_id: "ws-abc".into(),
//!     watch_path: PathBuf::from("/home/user/operator/workspaces/myrepo/tokyo"),
//!     debounce_ms: 300,
//!     auto_checkpoint: false,
//!     mirror_path: None,
//! }, app_handle)?;
//!
//! // Later:
//! watcher.stop();
//! ```

use std::{
    path::PathBuf,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    time::Duration,
};

use notify::RecursiveMode;
use notify_debouncer_mini::new_debouncer;
use serde::Serialize;
use tauri::Emitter;

use crate::error::AppError;

// ── Configuration ─────────────────────────────────────────────────────────────

/// Configuration for a per-workspace file watcher.
#[derive(Debug, Clone)]
pub struct WatcherConfig {
    /// Logical workspace identifier (used in emitted Tauri events).
    pub workspace_id: String,
    /// Absolute path to the worktree directory to watch.
    pub watch_path: PathBuf,
    /// Debounce window in milliseconds (default: 300).
    pub debounce_ms: u64,
    /// When `true`, auto-save a checkpoint after each stable change burst.
    pub auto_checkpoint: bool,
    /// Optional path for spotlight-style mirroring (future use).
    pub mirror_path: Option<PathBuf>,
}

impl Default for WatcherConfig {
    fn default() -> Self {
        Self {
            workspace_id: String::new(),
            watch_path: PathBuf::new(),
            debounce_ms: 300,
            auto_checkpoint: false,
            mirror_path: None,
        }
    }
}

// ── Event payload ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct DiffUpdatedPayload {
    pub workspace_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct CheckpointAutoSavedPayload {
    pub workspace_id: String,
    pub checkpoint_id: String,
    pub commit_sha: String,
}

// ── Watcher handle ────────────────────────────────────────────────────────────

/// An active per-workspace file watcher.
///
/// Drop or call `.stop()` to cancel the background thread.
pub struct WorkspaceWatcher {
    stopped: Arc<AtomicBool>,
    // The debouncer is kept alive here; dropping it stops the watcher.
    _debouncer: notify_debouncer_mini::Debouncer<notify::RecommendedWatcher>,
    workspace_id: String,
}

impl WorkspaceWatcher {
    /// Start watching `config.watch_path` and emitting Tauri events on change.
    pub fn start(
        config: WatcherConfig,
        app_handle: tauri::AppHandle,
    ) -> Result<Self, AppError> {
        let stopped = Arc::new(AtomicBool::new(false));
        let stopped_clone = stopped.clone();

        let workspace_id = config.workspace_id.clone();
        let watch_path = config.watch_path.clone();
        let auto_checkpoint = config.auto_checkpoint;

        let (tx, rx) = std::sync::mpsc::channel();

        let mut debouncer =
            new_debouncer(Duration::from_millis(config.debounce_ms), tx)
                .map_err(|e| AppError::msg(format!("watcher init error: {e}")))?;

        debouncer
            .watcher()
            .watch(&watch_path, RecursiveMode::Recursive)
            .map_err(|e| AppError::msg(format!("watcher watch error: {e}")))?;

        let workspace_id_clone = workspace_id.clone();
        let watch_path_clone = watch_path.clone();

        std::thread::spawn(move || {
            tracing::debug!(workspace_id = %workspace_id_clone, "watcher thread started");

            for result in rx {
                if stopped_clone.load(Ordering::Relaxed) {
                    break;
                }

                match result {
                    Ok(events) => {
                        // Filter out .git/ and .context/ noise (mirrors spotlighter.sh
                        // `--ignore '*.tmp.*'` and `--ignore '.context/**'`).
                        let relevant = events.iter().any(|e| {
                            let p = e.path.to_string_lossy();
                            !p.contains("/.git/") && !p.contains("\\.git\\")
                                && !p.contains("/.context/")
                        });

                        if !relevant {
                            continue;
                        }

                        tracing::debug!(
                            workspace_id = %workspace_id_clone,
                            n = events.len(),
                            "file change detected"
                        );

                        // Emit diff-updated event to frontend.
                        let _ = app_handle.emit(
                            "git_diff_updated",
                            DiffUpdatedPayload {
                                workspace_id: workspace_id_clone.clone(),
                            },
                        );

                        // Optional: auto-save a checkpoint after each burst.
                        if auto_checkpoint {
                            let cp_id = format!(
                                "auto-{}",
                                chrono::Utc::now().format("%Y%m%dT%H%M%SZ")
                            );
                            match crate::git::checkpoint::save(
                                &watch_path_clone,
                                Some(&cp_id),
                                true,
                            ) {
                                Ok(result) => {
                                    tracing::debug!(
                                        workspace_id = %workspace_id_clone,
                                        id = %result.id,
                                        "auto-checkpoint saved"
                                    );
                                    let _ = app_handle.emit(
                                        "checkpoint_auto_saved",
                                        CheckpointAutoSavedPayload {
                                            workspace_id: workspace_id_clone.clone(),
                                            checkpoint_id: result.id,
                                            commit_sha: result.commit_sha,
                                        },
                                    );
                                }
                                Err(e) => {
                                    // busy:* errors are expected during agent commits — skip silently.
                                    let msg = e.to_string();
                                    if !msg.starts_with("busy:") {
                                        tracing::warn!(
                                            workspace_id = %workspace_id_clone,
                                            error = %msg,
                                            "auto-checkpoint save failed"
                                        );
                                    }
                                }
                            }
                        }
                    }
                    Err(e) => {
                        tracing::warn!(
                            workspace_id = %workspace_id_clone,
                            error = %e,
                            "watcher error"
                        );
                    }
                }
            }

            tracing::debug!(workspace_id = %workspace_id_clone, "watcher thread stopped");
        });

        Ok(Self {
            stopped,
            _debouncer: debouncer,
            workspace_id,
        })
    }

    /// Signal the background thread to stop.
    pub fn stop(&self) {
        tracing::debug!(workspace_id = %self.workspace_id, "stopping watcher");
        self.stopped.store(true, Ordering::Relaxed);
    }

    pub fn workspace_id(&self) -> &str {
        &self.workspace_id
    }
}

impl Drop for WorkspaceWatcher {
    fn drop(&mut self) {
        self.stop();
    }
}
