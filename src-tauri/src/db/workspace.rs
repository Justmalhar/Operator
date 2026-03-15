use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Workspace {
    pub id: String,
    pub repository_id: String,
    pub city_name: String,
    pub branch_name: String,
    pub worktree_path: String,
    pub status: String,
    pub agent_backend: String,
    pub model: Option<String>,
    pub reasoning_level: Option<String>,
    pub port_base: Option<i64>,
    pub pr_url: Option<String>,
    pub pr_number: Option<i64>,
    pub total_cost_usd: f64,
    pub total_tokens: i64,
    pub is_archived: i64,
    pub archived_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateWorkspace {
    pub repository_id: String,
    pub city_name: String,
    pub branch_name: String,
    pub worktree_path: String,
    pub agent_backend: Option<String>,
    pub model: Option<String>,
    pub reasoning_level: Option<String>,
    pub port_base: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWorkspaceStatus {
    pub status: String,
}

pub async fn create(
    pool: &SqlitePool,
    input: CreateWorkspace,
) -> Result<Workspace, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let agent_backend = input.agent_backend.unwrap_or_else(|| "claude".into());
    let reasoning_level = input.reasoning_level.unwrap_or_else(|| "medium".into());

    sqlx::query(
        "INSERT INTO workspaces
         (id, repository_id, city_name, branch_name, worktree_path, agent_backend, model, reasoning_level, port_base)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.repository_id)
    .bind(&input.city_name)
    .bind(&input.branch_name)
    .bind(&input.worktree_path)
    .bind(&agent_backend)
    .bind(&input.model)
    .bind(&reasoning_level)
    .bind(input.port_base)
    .execute(pool)
    .await?;

    find_by_id(pool, &id).await?.ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Workspace>, sqlx::Error> {
    sqlx::query_as::<_, Workspace>("SELECT * FROM workspaces WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list_by_repo(
    pool: &SqlitePool,
    repository_id: &str,
) -> Result<Vec<Workspace>, sqlx::Error> {
    sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE repository_id = ? AND is_archived = 0 ORDER BY created_at DESC",
    )
    .bind(repository_id)
    .fetch_all(pool)
    .await
}

pub async fn list_all_active(pool: &SqlitePool) -> Result<Vec<Workspace>, sqlx::Error> {
    sqlx::query_as::<_, Workspace>(
        "SELECT * FROM workspaces WHERE is_archived = 0 ORDER BY created_at DESC",
    )
    .fetch_all(pool)
    .await
}

pub async fn set_status(
    pool: &SqlitePool,
    id: &str,
    status: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE workspaces
         SET status = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(status)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_pr(
    pool: &SqlitePool,
    id: &str,
    pr_url: &str,
    pr_number: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE workspaces
         SET pr_url = ?, pr_number = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(pr_url)
    .bind(pr_number)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn add_usage(
    pool: &SqlitePool,
    id: &str,
    cost_usd: f64,
    tokens: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE workspaces
         SET total_cost_usd = total_cost_usd + ?,
             total_tokens   = total_tokens + ?,
             updated_at     = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(cost_usd)
    .bind(tokens)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn archive(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE workspaces
         SET is_archived = 1,
             archived_at = strftime('%Y-%m-%dT%H:%M:%SZ','now'),
             updated_at  = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn rename(pool: &SqlitePool, id: &str, city_name: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE workspaces
         SET city_name = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(city_name)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM workspaces WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
