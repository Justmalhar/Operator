use std::collections::HashMap;
use std::io::Write;

use portable_pty::{native_pty_system, CommandBuilder, PtySize};

use crate::error::AppError;
use crate::providers::AgentArgs;
use super::reader;

// ---------------------------------------------------------------------------
// Internal session record
// ---------------------------------------------------------------------------

struct PtySession {
    /// Write-end of the PTY master — used to forward keyboard input.
    writer: Box<dyn Write + Send>,
    /// The master PTY handle — used for resize operations.
    master: Box<dyn portable_pty::MasterPty + Send>,
    /// The child process handle — used to send SIGKILL / wait.
    child: Box<dyn portable_pty::Child + Send + Sync>,
}

// ---------------------------------------------------------------------------
// Public manager
// ---------------------------------------------------------------------------

/// Owns one PTY session per workspace and provides lifecycle operations.
pub struct PtyManager {
    sessions: HashMap<String, PtySession>,
}

impl PtyManager {
    /// Create an empty manager with no active sessions.
    pub fn new() -> Self {
        Self {
            sessions: HashMap::new(),
        }
    }

    /// Spawn a new PTY process for `workspace_id`.
    ///
    /// Any existing session for that workspace is killed before the new one
    /// is started. The reader thread emits Tauri events on `app_handle`.
    pub fn spawn(
        &mut self,
        workspace_id: &str,
        args: &AgentArgs,
        worktree_path: &std::path::Path,
        app_handle: tauri::AppHandle,
    ) -> Result<(), AppError> {
        // Kill any pre-existing session for this workspace first.
        if self.sessions.contains_key(workspace_id) {
            let _ = self.kill(workspace_id);
        }

        // Allocate a native PTY pair (master + slave).
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows: 24,
                cols: 80,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::msg(format!("openpty failed: {e}")))?;

        // Build the command from provider-supplied arguments.
        let mut cmd = CommandBuilder::new(&args.program);
        for arg in &args.args {
            cmd.arg(arg);
        }
        for (key, val) in &args.env {
            cmd.env(key, val);
        }
        cmd.cwd(worktree_path);

        // Spawn the command on the slave side of the PTY.
        let child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| AppError::msg(format!("spawn_command failed: {e}")))?;

        // Obtain the write-end and read-end from the master.
        let writer = pair
            .master
            .take_writer()
            .map_err(|e| AppError::msg(format!("take_writer failed: {e}")))?;

        let reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| AppError::msg(format!("try_clone_reader failed: {e}")))?;

        // Spawn background thread that reads PTY output and emits Tauri events.
        reader::spawn_reader(workspace_id.to_string(), reader, app_handle);

        self.sessions.insert(
            workspace_id.to_string(),
            PtySession {
                writer,
                master: pair.master,
                child,
            },
        );

        Ok(())
    }

    /// Write raw bytes to the PTY stdin of the specified workspace.
    pub fn write_input(&mut self, workspace_id: &str, data: &[u8]) -> Result<(), AppError> {
        let session = self.sessions.get_mut(workspace_id).ok_or_else(|| {
            AppError::msg(format!("no active PTY session for workspace: {workspace_id}"))
        })?;

        session
            .writer
            .write_all(data)
            .map_err(|e| AppError::msg(format!("PTY write failed: {e}")))?;

        session
            .writer
            .flush()
            .map_err(|e| AppError::msg(format!("PTY flush failed: {e}")))?;

        Ok(())
    }

    /// Resize the PTY terminal window for the specified workspace.
    pub fn resize(&mut self, workspace_id: &str, cols: u16, rows: u16) -> Result<(), AppError> {
        let session = self.sessions.get_mut(workspace_id).ok_or_else(|| {
            AppError::msg(format!("no active PTY session for workspace: {workspace_id}"))
        })?;

        session
            .master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| AppError::msg(format!("PTY resize failed: {e}")))?;

        Ok(())
    }

    /// Send a kill signal to the PTY child process and remove the session.
    pub fn kill(&mut self, workspace_id: &str) -> Result<(), AppError> {
        let mut session = self.sessions.remove(workspace_id).ok_or_else(|| {
            AppError::msg(format!("no active PTY session for workspace: {workspace_id}"))
        })?;

        session
            .child
            .kill()
            .map_err(|e| AppError::msg(format!("PTY kill failed: {e}")))?;

        Ok(())
    }

    /// Returns `true` if a live PTY session exists for `workspace_id`.
    pub fn is_running(&self, workspace_id: &str) -> bool {
        self.sessions.contains_key(workspace_id)
    }

    /// Returns the list of workspace IDs that currently have active sessions.
    pub fn active_workspace_ids(&self) -> Vec<String> {
        self.sessions.keys().cloned().collect()
    }
}

impl Default for PtyManager {
    fn default() -> Self {
        Self::new()
    }
}
