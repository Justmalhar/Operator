//! Tauri commands — thin CRUD wrapper over `db::hook`.

use tauri::State;

use crate::{
    db::{
        self,
        hook::{CreateHook, Hook},
    },
    error::AppError,
    AppState,
};

/// List hooks. When `repository_id` is supplied, returns global hooks plus
/// repo-specific hooks.  When omitted, returns only global hooks.
#[tauri::command]
pub async fn list_hooks(
    state: State<'_, AppState>,
    repository_id: Option<String>,
) -> Result<Vec<Hook>, AppError> {
    match repository_id.as_deref() {
        Some(rid) => db::hook::list_for_repo(&state.db, rid).await.map_err(Into::into),
        None => db::hook::list_global(&state.db).await.map_err(Into::into),
    }
}

/// Create a new hook.
#[tauri::command]
pub async fn create_hook(
    state: State<'_, AppState>,
    input: CreateHook,
) -> Result<Hook, AppError> {
    db::hook::create(&state.db, input).await.map_err(Into::into)
}

/// Delete a hook by ID.
#[tauri::command]
pub async fn delete_hook(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    db::hook::delete(&state.db, &id).await.map_err(Into::into)
}

/// Enable or disable a hook.
#[tauri::command]
pub async fn set_hook_enabled(
    state: State<'_, AppState>,
    id: String,
    enabled: bool,
) -> Result<(), AppError> {
    db::hook::set_enabled(&state.db, &id, enabled)
        .await
        .map_err(Into::into)
}

/// Replace the handler script/command for a hook.
#[tauri::command]
pub async fn update_hook_handler(
    state: State<'_, AppState>,
    id: String,
    handler: String,
) -> Result<(), AppError> {
    db::hook::update_handler(&state.db, &id, &handler)
        .await
        .map_err(Into::into)
}
