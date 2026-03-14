use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Todo {
    pub id: String,
    pub workspace_id: String,
    pub text: String,
    pub completed: i64,
    pub source: String,
    pub position: i64,
    pub completed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateTodo {
    pub workspace_id: String,
    pub text: String,
    pub source: Option<String>,
    pub position: Option<i64>,
}

pub async fn create(pool: &SqlitePool, input: CreateTodo) -> Result<Todo, sqlx::Error> {
    let id = Uuid::new_v4().to_string();
    let source = input.source.unwrap_or_else(|| "manual".into());

    // Default position: end of list
    let position = if let Some(p) = input.position {
        p
    } else {
        let row: (i64,) = sqlx::query_as(
            "SELECT COALESCE(MAX(position), -1) + 1 FROM todos WHERE workspace_id = ?",
        )
        .bind(&input.workspace_id)
        .fetch_one(pool)
        .await?;
        row.0
    };

    sqlx::query(
        "INSERT INTO todos (id, workspace_id, text, source, position)
         VALUES (?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&input.workspace_id)
    .bind(&input.text)
    .bind(&source)
    .bind(position)
    .execute(pool)
    .await?;

    find_by_id(pool, &id).await?.ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Todo>, sqlx::Error> {
    sqlx::query_as::<_, Todo>("SELECT * FROM todos WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn list_by_workspace(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<Vec<Todo>, sqlx::Error> {
    sqlx::query_as::<_, Todo>(
        "SELECT * FROM todos WHERE workspace_id = ? ORDER BY position ASC, created_at ASC",
    )
    .bind(workspace_id)
    .fetch_all(pool)
    .await
}

pub async fn set_completed(
    pool: &SqlitePool,
    id: &str,
    completed: bool,
) -> Result<(), sqlx::Error> {
    if completed {
        sqlx::query(
            "UPDATE todos
             SET completed = 1, completed_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
             WHERE id = ?",
        )
        .bind(id)
        .execute(pool)
        .await?;
    } else {
        sqlx::query(
            "UPDATE todos SET completed = 0, completed_at = NULL WHERE id = ?",
        )
        .bind(id)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn update_text(pool: &SqlitePool, id: &str, text: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE todos SET text = ? WHERE id = ?")
        .bind(text)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn reorder(
    pool: &SqlitePool,
    id: &str,
    new_position: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE todos SET position = ? WHERE id = ?")
        .bind(new_position)
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM todos WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete_completed(
    pool: &SqlitePool,
    workspace_id: &str,
) -> Result<u64, sqlx::Error> {
    let r = sqlx::query(
        "DELETE FROM todos WHERE workspace_id = ? AND completed = 1",
    )
    .bind(workspace_id)
    .execute(pool)
    .await?;
    Ok(r.rows_affected())
}
