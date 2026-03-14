use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Repository {
    pub id: String,
    pub name: String,
    pub full_name: String,
    pub remote_url: String,
    pub local_path: String,
    pub platform: String,
    pub default_branch: String,
    pub icon_path: Option<String>,
    pub operator_json: Option<String>,
    pub last_synced: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateRepository {
    pub name: String,
    pub full_name: String,
    pub remote_url: String,
    pub local_path: String,
    pub platform: Option<String>,
    pub default_branch: Option<String>,
    pub icon_path: Option<String>,
    pub operator_json: Option<String>,
}

pub async fn create(pool: &SqlitePool, input: CreateRepository) -> Result<Repository, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let platform = input.platform.unwrap_or_else(|| "github".into());
    let default_branch = input.default_branch.unwrap_or_else(|| "main".into());

    sqlx::query(
        "INSERT INTO repositories
         (id, name, full_name, remote_url, local_path, platform, default_branch, icon_path, operator_json)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.full_name)
    .bind(&input.remote_url)
    .bind(&input.local_path)
    .bind(&platform)
    .bind(&default_branch)
    .bind(&input.icon_path)
    .bind(&input.operator_json)
    .execute(pool)
    .await?;

    find_by_id(pool, &id).await?.ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Repository>, sqlx::Error> {
    sqlx::query_as::<_, Repository>("SELECT * FROM repositories WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn find_by_path(
    pool: &SqlitePool,
    local_path: &str,
) -> Result<Option<Repository>, sqlx::Error> {
    sqlx::query_as::<_, Repository>("SELECT * FROM repositories WHERE local_path = ?")
        .bind(local_path)
        .fetch_optional(pool)
        .await
}

pub async fn list(pool: &SqlitePool) -> Result<Vec<Repository>, sqlx::Error> {
    sqlx::query_as::<_, Repository>(
        "SELECT * FROM repositories ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn update_operator_json(
    pool: &SqlitePool,
    id: &str,
    operator_json: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE repositories
         SET operator_json = ?,
             last_synced   = strftime('%Y-%m-%dT%H:%M:%SZ','now'),
             updated_at    = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(operator_json)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn update_icon(
    pool: &SqlitePool,
    id: &str,
    icon_path: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE repositories
         SET icon_path  = ?,
             updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(icon_path)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM repositories WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
