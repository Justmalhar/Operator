//! Tauri commands for terminal PTY interaction.
//!
//! These are thin wrappers around `PtyManager` that the frontend xterm.js
//! instance calls directly for keyboard input and resize events.

use tauri::State;

use crate::{error::AppError, AppState};

/// Write raw bytes to the PTY stdin for the given workspace.
///
/// Called by the frontend whenever the user types into the terminal.
#[tauri::command]
pub async fn terminal_write(
    state: State<'_, AppState>,
    workspace_id: String,
    data: String,
) -> Result<(), AppError> {
    let mut mgr = state
        .pty_manager
        .lock()
        .map_err(|_| AppError::msg("pty_manager lock poisoned"))?;

    mgr.write_input(&workspace_id, data.as_bytes())
}

/// Notify the PTY of a terminal resize (cols × rows).
///
/// Must be called whenever the frontend xterm.js container is resized so that
/// the agent process sees the correct terminal dimensions.
#[tauri::command]
pub async fn terminal_resize(
    state: State<'_, AppState>,
    workspace_id: String,
    cols: u16,
    rows: u16,
) -> Result<(), AppError> {
    let mut mgr = state
        .pty_manager
        .lock()
        .map_err(|_| AppError::msg("pty_manager lock poisoned"))?;

    mgr.resize(&workspace_id, cols, rows)
}
