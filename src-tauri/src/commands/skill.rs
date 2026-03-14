//! Tauri commands — thin CRUD wrapper over `db::skill`.

use tauri::State;

use crate::{
    db::{
        self,
        skill::{Skill, UpsertSkill},
    },
    error::AppError,
    AppState,
};

/// List all skills ordered by category then display name.
#[tauri::command]
pub async fn list_skills(state: State<'_, AppState>) -> Result<Vec<Skill>, AppError> {
    db::skill::list(&state.db).await.map_err(Into::into)
}

/// Create or update a skill by `name` (upsert semantics).
#[tauri::command]
pub async fn upsert_skill(
    state: State<'_, AppState>,
    input: UpsertSkill,
) -> Result<Skill, AppError> {
    db::skill::upsert(&state.db, input).await.map_err(Into::into)
}

/// Enable or disable a skill.
#[tauri::command]
pub async fn set_skill_enabled(
    state: State<'_, AppState>,
    id: String,
    enabled: bool,
) -> Result<(), AppError> {
    db::skill::set_enabled(&state.db, &id, enabled)
        .await
        .map_err(Into::into)
}

/// Delete a user-defined skill (built-in skills are protected and ignored).
#[tauri::command]
pub async fn delete_skill(
    state: State<'_, AppState>,
    id: String,
) -> Result<(), AppError> {
    db::skill::delete(&state.db, &id).await.map_err(Into::into)
}

/// Look up a skill by its unique `name` slug.
///
/// Returns `None` when no skill with that name exists.
#[tauri::command]
pub async fn get_skill_by_name(
    state: State<'_, AppState>,
    name: String,
) -> Result<Option<Skill>, AppError> {
    db::skill::find_by_name(&state.db, &name)
        .await
        .map_err(Into::into)
}
