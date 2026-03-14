use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Hook {
    pub id: String,
    /// NULL = global hook
    pub repository_id: Option<String>,
    pub event: String,
    pub matcher: Option<String>,
    pub handler_type: String,
    pub handler: String,
    pub is_enabled: i64,
    pub is_preset: i64,
    pub preset_id: Option<String>,
    pub position: i64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateHook {
    pub repository_id: Option<String>,
    pub event: String,
    pub matcher: Option<String>,
    pub handler_type: String,
    pub handler: String,
    pub is_preset: Option<bool>,
    pub preset_id: Option<String>,
    pub position: Option<i64>,
}

pub async fn create(pool: &SqlitePool, input: CreateHook) -> Result<Hook, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let is_preset = input.is_preset.unwrap_or(false) as i64;
    let position = input.position.unwrap_or(0);

    sqlx::query(
        "INSERT INTO hooks
         (id, repository_id, event, matcher, handler_type, handler, is_preset, preset_id, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.repository_id)
    .bind(&input.event)
    .bind(&input.matcher)
    .bind(&input.handler_type)
    .bind(&input.handler)
    .bind(is_preset)
    .bind(&input.preset_id)
    .bind(position)
    .execute(pool)
    .await?;

    find_by_id(pool, &id).await?.ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Hook>, sqlx::Error> {
    sqlx::query_as::<_, Hook>("SELECT * FROM hooks WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

/// Returns global hooks (repository_id IS NULL) + repo-specific hooks, ordered by position.
pub async fn list_for_repo(
    pool: &SqlitePool,
    repository_id: &str,
) -> Result<Vec<Hook>, sqlx::Error> {
    sqlx::query_as::<_, Hook>(
        "SELECT * FROM hooks
         WHERE repository_id IS NULL OR repository_id = ?
         ORDER BY event ASC, position ASC",
    )
    .bind(repository_id)
    .fetch_all(pool)
    .await
}

pub async fn list_global(pool: &SqlitePool) -> Result<Vec<Hook>, sqlx::Error> {
    sqlx::query_as::<_, Hook>(
        "SELECT * FROM hooks WHERE repository_id IS NULL ORDER BY event ASC, position ASC",
    )
    .fetch_all(pool)
    .await
}

pub async fn set_enabled(
    pool: &SqlitePool,
    id: &str,
    enabled: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE hooks SET is_enabled = ? WHERE id = ?")
        .bind(enabled as i64)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn update_handler(
    pool: &SqlitePool,
    id: &str,
    handler: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE hooks SET handler = ? WHERE id = ?")
        .bind(handler)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM hooks WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
