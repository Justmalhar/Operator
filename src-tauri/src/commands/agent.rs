//! Tauri commands for agent lifecycle: launch, stop, input forwarding, status.

use std::path::PathBuf;

use tauri::State;

use crate::{db, error::AppError, providers, AppState};

// ── Launch ────────────────────────────────────────────────────────────────────

/// Launch an AI agent process inside the workspace's PTY.
///
/// Looks up the workspace, resolves provider settings (API key, model), builds
/// the agent command via `providers::build_args`, sets workspace status to
/// "running", then spawns the process through `PtyManager`.
#[tauri::command]
pub async fn launch_agent(
    state: State<'_, AppState>,
    workspace_id: String,
    _repo_path: String,
    initial_prompt: Option<String>,
    app_handle: tauri::AppHandle,
) -> Result<(), AppError> {
    // Load the workspace row.
    let workspace = db::workspace::find_by_id(&state.db, &workspace_id)
        .await?
        .ok_or_else(|| AppError::msg(format!("workspace not found: {workspace_id}")))?;

    let backend = workspace.agent_backend.as_str();

    // Resolve the API key for the configured backend.
    let api_key_setting = match backend {
        "claude" | "claudecode" => "anthropic_api_key",
        "codex" => "openai_api_key",
        "gemini" => "google_api_key",
        "cursor" => "cursor_api_key",
        "opencode" => "openai_api_key",
        other => {
            return Err(AppError::msg(format!("unknown agent backend: {other}")));
        }
    };

    let api_key = db::variables::setting_get(&state.db, api_key_setting).await?;

    let worktree_path = PathBuf::from(&workspace.worktree_path);
    let port_base = workspace.port_base.unwrap_or(3000) as u16;

    let config = providers::LaunchConfig {
        workspace_id: workspace_id.clone(),
        worktree_path: worktree_path.clone(),
        branch_name: workspace.branch_name.clone(),
        model: workspace.model.clone(),
        reasoning_level: workspace.reasoning_level.clone(),
        api_key,
        port_base,
        initial_prompt,
    };

    let agent_args = providers::build_args(backend, &config)?;

    // Mark workspace as running before spawning so the UI reflects state
    // immediately (the process may take a moment to start).
    db::workspace::set_status(&state.db, &workspace_id, "running").await?;

    // Spawn the PTY process.
    {
        let mut mgr = state
            .pty_manager
            .lock()
            .map_err(|_| AppError::msg("pty_manager lock poisoned"))?;

        mgr.spawn(&workspace_id, &agent_args, &worktree_path, app_handle)?;
    }

    tracing::info!(workspace_id, backend, "agent launched");

    Ok(())
}

// ── Stop ──────────────────────────────────────────────────────────────────────

/// Stop the agent running in a workspace PTY.
///
/// Sends SIGKILL to the child process and sets workspace status to "idle".
#[tauri::command]
pub async fn stop_agent(
    state: State<'_, AppState>,
    workspace_id: String,
) -> Result<(), AppError> {
    {
        let mut mgr = state
            .pty_manager
            .lock()
            .map_err(|_| AppError::msg("pty_manager lock poisoned"))?;

        if mgr.is_running(&workspace_id) {
            mgr.kill(&workspace_id)?;
        }
    }

    db::workspace::set_status(&state.db, &workspace_id, "idle").await?;

    tracing::info!(workspace_id, "agent stopped");

    Ok(())
}

// ── Input ─────────────────────────────────────────────────────────────────────

/// Forward raw text input to the agent PTY (keyboard passthrough).
#[tauri::command]
pub async fn send_agent_input(
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

// ── Status ────────────────────────────────────────────────────────────────────

/// Return `true` if an agent PTY session is currently active for the workspace.
#[tauri::command]
pub async fn is_agent_running(
    state: State<'_, AppState>,
    workspace_id: String,
) -> Result<bool, AppError> {
    let mgr = state
        .pty_manager
        .lock()
        .map_err(|_| AppError::msg("pty_manager lock poisoned"))?;

    Ok(mgr.is_running(&workspace_id))
}

/// Return the list of workspace IDs that currently have active agent sessions.
#[tauri::command]
pub async fn list_active_agents(
    state: State<'_, AppState>,
) -> Result<Vec<String>, AppError> {
    let mgr = state
        .pty_manager
        .lock()
        .map_err(|_| AppError::msg("pty_manager lock poisoned"))?;

    Ok(mgr.active_workspace_ids())
}
