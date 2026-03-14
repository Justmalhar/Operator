/// CRUD for: settings, automations, memory_notes, git_operations_log
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

// ─── Settings ────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Setting {
    pub key: String,
    pub value: String,
    pub updated_at: String,
}

pub async fn setting_get(pool: &SqlitePool, key: &str) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT value FROM settings WHERE key = ?")
            .bind(key)
            .fetch_optional(pool)
            .await?;
    Ok(row.map(|r| r.0))
}

pub async fn setting_set(pool: &SqlitePool, key: &str, value: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO settings (key, value)
         VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET
           value      = excluded.value,
           updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')",
    )
    .bind(key)
    .bind(value)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn setting_delete(pool: &SqlitePool, key: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM settings WHERE key = ?")
        .bind(key)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn settings_all(pool: &SqlitePool) -> Result<Vec<Setting>, sqlx::Error> {
    sqlx::query_as::<_, Setting>("SELECT * FROM settings ORDER BY key ASC")
        .fetch_all(pool)
        .await
}

// ─── Automations ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Automation {
    pub id: String,
    pub repository_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub trigger_type: String,
    pub trigger_config: Option<String>,
    pub prompt: String,
    pub model: Option<String>,
    pub is_enabled: i64,
    pub last_run_at: Option<String>,
    pub last_run_status: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAutomation {
    pub repository_id: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub trigger_type: String,
    pub trigger_config: Option<String>,
    pub prompt: String,
    pub model: Option<String>,
}

pub async fn automation_create(
    pool: &SqlitePool,
    input: CreateAutomation,
) -> Result<Automation, sqlx::Error> {
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO automations
         (id, repository_id, name, description, trigger_type, trigger_config, prompt, model)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.repository_id)
    .bind(&input.name)
    .bind(&input.description)
    .bind(&input.trigger_type)
    .bind(&input.trigger_config)
    .bind(&input.prompt)
    .bind(&input.model)
    .execute(pool)
    .await?;

    automation_find_by_id(pool, &id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

pub async fn automation_find_by_id(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<Automation>, sqlx::Error> {
    sqlx::query_as::<_, Automation>("SELECT * FROM automations WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn automation_list(
    pool: &SqlitePool,
    repository_id: Option<&str>,
) -> Result<Vec<Automation>, sqlx::Error> {
    match repository_id {
        Some(rid) => {
            sqlx::query_as::<_, Automation>(
                "SELECT * FROM automations WHERE repository_id = ? OR repository_id IS NULL ORDER BY created_at DESC",
            )
            .bind(rid)
            .fetch_all(pool)
            .await
        }
        None => {
            sqlx::query_as::<_, Automation>(
                "SELECT * FROM automations ORDER BY created_at DESC",
            )
            .fetch_all(pool)
            .await
        }
    }
}

pub async fn automation_set_last_run(
    pool: &SqlitePool,
    id: &str,
    status: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE automations
         SET last_run_at     = strftime('%Y-%m-%dT%H:%M:%SZ','now'),
             last_run_status = ?
         WHERE id = ?",
    )
    .bind(status)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn automation_delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM automations WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Memory notes ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct MemoryNote {
    pub id: String,
    pub repository_id: Option<String>,
    pub content: String,
    pub source: String,
    pub is_stale: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateMemoryNote {
    pub repository_id: Option<String>,
    pub content: String,
    pub source: Option<String>,
}

pub async fn memory_create(
    pool: &SqlitePool,
    input: CreateMemoryNote,
) -> Result<MemoryNote, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let source = input.source.unwrap_or_else(|| "agent".into());

    sqlx::query(
        "INSERT INTO memory_notes (id, repository_id, content, source)
         VALUES (?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.repository_id)
    .bind(&input.content)
    .bind(&source)
    .execute(pool)
    .await?;

    memory_find_by_id(pool, &id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

pub async fn memory_find_by_id(
    pool: &SqlitePool,
    id: &str,
) -> Result<Option<MemoryNote>, sqlx::Error> {
    sqlx::query_as::<_, MemoryNote>("SELECT * FROM memory_notes WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn memory_list(
    pool: &SqlitePool,
    repository_id: Option<&str>,
) -> Result<Vec<MemoryNote>, sqlx::Error> {
    match repository_id {
        Some(rid) => sqlx::query_as::<_, MemoryNote>(
            "SELECT * FROM memory_notes WHERE repository_id = ? OR repository_id IS NULL ORDER BY created_at DESC",
        )
        .bind(rid)
        .fetch_all(pool)
        .await,
        None => sqlx::query_as::<_, MemoryNote>(
            "SELECT * FROM memory_notes WHERE repository_id IS NULL ORDER BY created_at DESC",
        )
        .fetch_all(pool)
        .await,
    }
}

pub async fn memory_update(
    pool: &SqlitePool,
    id: &str,
    content: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE memory_notes
         SET content = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(content)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn memory_mark_stale(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE memory_notes SET is_stale = 1 WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn memory_delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM memory_notes WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

// ─── Git operations log ────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct GitOperationLog {
    pub id: String,
    pub workspace_id: Option<String>,
    pub operation: String,
    pub details: Option<String>,
    pub git_sha: Option<String>,
    pub success: i64,
    pub error_message: Option<String>,
    pub duration_ms: Option<i64>,
    pub created_at: String,
}

#[derive(Debug)]
pub struct LogGitOp {
    pub workspace_id: Option<String>,
    pub operation: String,
    pub details: Option<String>,
    pub git_sha: Option<String>,
    pub success: bool,
    pub error_message: Option<String>,
    pub duration_ms: Option<i64>,
}

pub async fn git_log_insert(
    pool: &SqlitePool,
    input: LogGitOp,
) -> Result<(), sqlx::Error> {
    let id = Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT INTO git_operations_log
         (id, workspace_id, operation, details, git_sha, success, error_message, duration_ms)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.workspace_id)
    .bind(&input.operation)
    .bind(&input.details)
    .bind(&input.git_sha)
    .bind(input.success as i64)
    .bind(&input.error_message)
    .bind(input.duration_ms)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn git_log_list_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
    limit: i64,
) -> Result<Vec<GitOperationLog>, sqlx::Error> {
    sqlx::query_as::<_, GitOperationLog>(
        "SELECT * FROM git_operations_log
         WHERE workspace_id = ?
         ORDER BY created_at DESC
         LIMIT ?",
    )
    .bind(workspace_id)
    .bind(limit)
    .fetch_all(pool)
    .await
}

/// Prune entries older than `days`.
pub async fn git_log_prune(pool: &SqlitePool, days: i64) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM git_operations_log
         WHERE created_at < strftime('%Y-%m-%dT%H:%M:%SZ','now', ? || ' days')",
    )
    .bind(format!("-{}", days))
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
