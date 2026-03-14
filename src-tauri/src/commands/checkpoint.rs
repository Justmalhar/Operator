//! Tauri commands for the checkpoint system.
//!
//! These commands expose `git::checkpoint` operations to the React frontend
//! and persist results in SQLite via `db::checkpoint`.

use std::path::PathBuf;

use tauri::State;

use crate::{
    db,
    error::AppError,
    git,
    AppState,
};

// ── save ──────────────────────────────────────────────────────────────────────

/// Save a checkpoint of the current working-tree state for a workspace.
///
/// Called automatically before each agent turn (via the hook system) and
/// on-demand from the UI ("Save checkpoint" button).
///
/// Returns the persisted `Checkpoint` row so the frontend can display a
/// "Revert" button in the chat timeline.
#[tauri::command]
pub async fn save_checkpoint(
    state: State<'_, AppState>,
    workspace_id: String,
    repo_path: String,
    turn_id: String,
    description: Option<String>,
    force: Option<bool>,
) -> Result<db::checkpoint::Checkpoint, AppError> {
    // Derive a deterministic ref id from workspace + turn ids.
    let cp_id = format!("ws-{workspace_id}-turn-{turn_id}");

    let result = git::checkpoint::save(
        &PathBuf::from(&repo_path),
        Some(&cp_id),
        force.unwrap_or(true),
    )?;

    let checkpoint = db::checkpoint::create(
        &state.db,
        db::checkpoint::CreateCheckpoint {
            workspace_id,
            turn_id,
            git_sha: result.commit_sha,
            git_ref: result.git_ref,
            description,
        },
    )
    .await?;

    Ok(checkpoint)
}

// ── restore ───────────────────────────────────────────────────────────────────

/// Restore the workspace to a previously saved checkpoint.
///
/// Performs a hard reset to the saved HEAD, overlays the full worktree
/// snapshot, and restores the staged index.
#[tauri::command]
pub async fn restore_checkpoint(
    state: State<'_, AppState>,
    checkpoint_id: String,
    repo_path: String,
) -> Result<(), AppError> {
    // Look up the checkpoint row to get the git ref id segment.
    let row = db::checkpoint::find_by_id(&state.db, &checkpoint_id)
        .await?
        .ok_or_else(|| AppError::msg(format!("checkpoint not found: {checkpoint_id}")))?;

    // The id segment stored in git_ref is everything after the prefix.
    // git_ref format: `refs/operator/checkpoints/<id>`
    let ref_prefix = "refs/operator/checkpoints/";
    let id_segment = row
        .git_ref
        .strip_prefix(ref_prefix)
        .unwrap_or(&row.git_ref);

    git::checkpoint::restore(&PathBuf::from(&repo_path), id_segment)?;

    Ok(())
}

// ── diff ──────────────────────────────────────────────────────────────────────

/// Diff two checkpoints (or one checkpoint vs the current working tree).
///
/// Pass `"current"` for `id2` to compare against live state.
/// Returns a unified-diff string suitable for rendering in the diff viewer.
#[tauri::command]
pub async fn diff_checkpoints(
    state: State<'_, AppState>,
    repo_path: String,
    checkpoint_id1: String,
    checkpoint_id2: String,
) -> Result<String, AppError> {
    let resolve_id = |db_id: &str| -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<String, AppError>> + Send>> {
        if db_id == "current" {
            return Box::pin(async move { Ok("current".to_owned()) });
        }
        let db = state.db.clone();
        let id = db_id.to_owned();
        Box::pin(async move {
            let row = db::checkpoint::find_by_id(&db, &id)
                .await?
                .ok_or_else(|| AppError::msg(format!("checkpoint not found: {id}")))?;
            let ref_prefix = "refs/operator/checkpoints/";
            Ok(row
                .git_ref
                .strip_prefix(ref_prefix)
                .unwrap_or(&row.git_ref)
                .to_owned())
        })
    };

    let seg1 = resolve_id(&checkpoint_id1).await?;
    let seg2 = resolve_id(&checkpoint_id2).await?;

    git::checkpoint::diff(&PathBuf::from(&repo_path), &seg1, &seg2)
}

// ── list ──────────────────────────────────────────────────────────────────────

/// List all checkpoints for a workspace, newest first.
#[tauri::command]
pub async fn list_checkpoints(
    state: State<'_, AppState>,
    workspace_id: String,
) -> Result<Vec<db::checkpoint::Checkpoint>, AppError> {
    db::checkpoint::list_by_workspace(&state.db, &workspace_id)
        .await
        .map_err(Into::into)
}

// ── busy_state ────────────────────────────────────────────────────────────────

/// Return the git-operation state of a repository.
///
/// The frontend uses this to disable the "Save checkpoint" button when a
/// merge or rebase is in progress (mirrors `git-busy-check.sh`).
#[tauri::command]
pub fn checkpoint_busy_state(
    repo_path: String,
) -> Result<git::checkpoint::BusyState, AppError> {
    git::checkpoint::busy_state(&PathBuf::from(&repo_path))
}

// ── delete ────────────────────────────────────────────────────────────────────

/// Delete a checkpoint record from SQLite (does NOT delete the git ref —
/// orphan commits are GC'd by git automatically).
#[tauri::command]
pub async fn delete_checkpoint(
    state: State<'_, AppState>,
    checkpoint_id: String,
) -> Result<(), AppError> {
    db::checkpoint::delete(&state.db, &checkpoint_id)
        .await
        .map_err(Into::into)
}
