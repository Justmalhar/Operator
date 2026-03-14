use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Message {
    pub id: String,
    pub workspace_id: String,
    pub role: String,
    pub content: String,
    pub turn_id: Option<String>,
    pub model: Option<String>,
    /// JSON array of ToolCall objects
    pub tool_calls: Option<String>,
    /// JSON array of FileChange objects
    pub file_changes: Option<String>,
    pub duration_ms: Option<i64>,
    pub input_tokens: Option<i64>,
    pub output_tokens: Option<i64>,
    pub cost_usd: f64,
    pub is_checkpoint_turn: i64,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMessage {
    pub workspace_id: String,
    pub role: String,
    pub content: String,
    pub turn_id: Option<String>,
    pub model: Option<String>,
    pub tool_calls: Option<String>,
    pub file_changes: Option<String>,
    pub duration_ms: Option<i64>,
    pub input_tokens: Option<i64>,
    pub output_tokens: Option<i64>,
    pub cost_usd: Option<f64>,
    pub is_checkpoint_turn: Option<bool>,
}

pub async fn create(pool: &SqlitePool, input: CreateMessage) -> Result<Message, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let cost_usd = input.cost_usd.unwrap_or(0.0);
    let is_checkpoint_turn = input.is_checkpoint_turn.unwrap_or(false) as i64;

    sqlx::query(
        "INSERT INTO messages
         (id, workspace_id, role, content, turn_id, model, tool_calls, file_changes,
          duration_ms, input_tokens, output_tokens, cost_usd, is_checkpoint_turn)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.workspace_id)
    .bind(&input.role)
    .bind(&input.content)
    .bind(&input.turn_id)
    .bind(&input.model)
    .bind(&input.tool_calls)
    .bind(&input.file_changes)
    .bind(input.duration_ms)
    .bind(input.input_tokens)
    .bind(input.output_tokens)
    .bind(cost_usd)
    .bind(is_checkpoint_turn)
    .execute(pool)
    .await?;

    find_by_id(pool, &id).await?.ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Message>, sqlx::Error> {
    sqlx::query_as::<_, Message>("SELECT * FROM messages WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<Vec<Message>, sqlx::Error> {
    sqlx::query_as::<_, Message>(
        "SELECT * FROM messages WHERE workspace_id = ? ORDER BY created_at ASC",
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
}

pub async fn list_by_workspace_paginated(
    pool: &SqlitePool,
    workspace_id: &str,
    limit: i64,
    before_id: Option<&str>,
) -> Result<Vec<Message>, sqlx::Error> {
    if let Some(before) = before_id {
        sqlx::query_as::<_, Message>(
            "SELECT * FROM messages
             WHERE workspace_id = ? AND created_at < (SELECT created_at FROM messages WHERE id = ?)
             ORDER BY created_at DESC
             LIMIT ?",
        )
        .bind(workspace_id)
        .bind(before)
        .bind(limit)
        .fetch_all(pool)
        .await
    } else {
        sqlx::query_as::<_, Message>(
            "SELECT * FROM messages WHERE workspace_id = ? ORDER BY created_at DESC LIMIT ?",
        )
        .bind(workspace_id)
        .bind(limit)
        .fetch_all(pool)
        .await
    }
}

/// Mark the last user message in a turn as a checkpoint turn.
pub async fn mark_checkpoint_turn(
    pool: &SqlitePool,
    turn_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE messages SET is_checkpoint_turn = 1 WHERE turn_id = ? AND role = 'user'",
    )
    .bind(turn_id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM messages WHERE workspace_id = ?")
        .bind(workspace_id)
        .execute(pool)
        .await?;
    Ok(())
}
