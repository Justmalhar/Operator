use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Checkpoint {
    pub id: String,
    pub workspace_id: String,
    pub turn_id: String,
    pub git_sha: String,
    pub git_ref: String,
    pub description: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateCheckpoint {
    pub workspace_id: String,
    pub turn_id: String,
    pub git_sha: String,
    pub git_ref: String,
    pub description: Option<String>,
}

pub async fn create(
    pool: &SqlitePool,
    input: CreateCheckpoint,
) -> Result<Checkpoint, sqlx::Error> {
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO checkpoints (id, workspace_id, turn_id, git_sha, git_ref, description)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.workspace_id)
    .bind(&input.turn_id)
    .bind(&input.git_sha)
    .bind(&input.git_ref)
    .bind(&input.description)
    .execute(pool)
    .await?;

    find_by_id(pool, &id).await?.ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Checkpoint>, sqlx::Error> {
    sqlx::query_as::<_, Checkpoint>("SELECT * FROM checkpoints WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn find_by_turn(
    pool: &SqlitePool,
    workspace_id: &str,
    turn_id: &str,
) -> Result<Option<Checkpoint>, sqlx::Error> {
    sqlx::query_as::<_, Checkpoint>(
        "SELECT * FROM checkpoints WHERE workspace_id = ? AND turn_id = ?",
    )
    .bind(workspace_id)
    .bind(turn_id)
    .fetch_optional(pool)
    .await
}

pub async fn list_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<Vec<Checkpoint>, sqlx::Error> {
    sqlx::query_as::<_, Checkpoint>(
        "SELECT * FROM checkpoints WHERE workspace_id = ? ORDER BY created_at DESC",
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
}

/// Delete checkpoints older than `days` for a given workspace.
pub async fn prune_old(
    pool: &SqlitePool,
    workspace_id: &str,
    days: i64,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM checkpoints
         WHERE workspace_id = ?
           AND created_at < strftime('%Y-%m-%dT%H:%M:%SZ', 'now', ? || ' days')",
    )
    .bind(workspace_id)
    .bind(format!("-{}", days))
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}

pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM checkpoints WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
