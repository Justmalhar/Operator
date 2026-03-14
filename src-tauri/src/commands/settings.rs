//! Tauri commands for settings, automations, and memory notes.
//!
//! All three tables live in `db::variables` and share similar CRUD patterns.

use tauri::State;

use crate::{db, error::AppError, AppState};

// ── Settings (key/value store) ────────────────────────────────────────────────

/// Retrieve the value for a single settings key.
///
/// Returns `None` when the key is not set.
#[tauri::command]
pub async fn get_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<Option<String>, AppError> {
    db::variables::setting_get(&state.db, &key)
        .await
        .map_err(Into::into)
}

/// Set (insert or update) a settings key/value pair.
#[tauri::command]
pub async fn set_setting(
    state: State<'_, AppState>,
    key: String,
    value: String,
) -> Result<(), AppError> {
    db::variables::setting_set(&state.db, &key, &value)
        .await
        .map_err(Into::into)
}

/// Delete a settings key.
#[tauri::command]
pub async fn delete_setting(
    state: State<'_, AppState>,
    key: String,
) -> Result<(), AppError> {
    db::variables::setting_delete(&state.db, &key)
        .await
        .map_err(Into::into)
}

/// Return all settings rows ordered by key.
#[tauri::command]
pub async fn get_all_settings(
    state: State<'_, AppState>,
) -> Result<Vec<db::variables::Setting>, AppError> {
    db::variables::settings_all(&state.db)
        .await
        .map_err(Into::into)
}

// ── Automations ───────────────────────────────────────────────────────────────

/// List automations.  When `repository_id` is given, returns repo-specific and
/// global automations; otherwise returns all automations.
#[tauri::command]
pub async fn list_automations(
    state: State<'_, AppState>,
    repository_id: Option<String>,
) -> Result<Vec<db::variables::Automation>, AppError> {
    db::variables::automation_list(&state.db, repository_id.as_deref())
        .await
        .map_err(Into::into)
}

/// Create a new automation.
#[tauri::command]
pub async fn create_automation(
    state: State<'_, AppState>,
    input: db::variables::CreateAutomation,
) -> Result<db::variables::Automation, AppError> {
    db::variables::automation_create(&state.db, input)
        .await
        .map_err(Into::into)
}

/// Delete an automation by ID.
#[tauri::command]
pub async fn delete_automation(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    db::variables::automation_delete(&state.db, &id)
        .await
        .map_err(Into::into)
}

// ── Memory notes ──────────────────────────────────────────────────────────────

/// List memory notes.  When `repository_id` is provided, returns repo-specific
/// and global notes; otherwise returns only global (repository_id IS NULL) notes.
#[tauri::command]
pub async fn list_memory_notes(
    state: State<'_, AppState>,
    repository_id: Option<String>,
) -> Result<Vec<db::variables::MemoryNote>, AppError> {
    db::variables::memory_list(&state.db, repository_id.as_deref())
        .await
        .map_err(Into::into)
}

/// Create a new memory note.
#[tauri::command]
pub async fn create_memory_note(
    state: State<'_, AppState>,
    input: db::variables::CreateMemoryNote,
) -> Result<db::variables::MemoryNote, AppError> {
    db::variables::memory_create(&state.db, input)
        .await
        .map_err(Into::into)
}

/// Delete a memory note by ID.
#[tauri::command]
pub async fn delete_memory_note(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    db::variables::memory_delete(&state.db, &id)
        .await
        .map_err(Into::into)
}
