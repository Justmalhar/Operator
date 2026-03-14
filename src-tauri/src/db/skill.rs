use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub category: String,
    pub skill_md: String,
    pub allowed_tools: Option<String>,
    pub context: String,
    pub agent: Option<String>,
    pub auto_invoke: i64,
    pub is_builtin: i64,
    pub install_scope: Option<String>,
    pub installed_path: Option<String>,
    pub is_enabled: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct UpsertSkill {
    pub id: Option<String>,
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub category: String,
    pub skill_md: String,
    pub allowed_tools: Option<String>,
    pub context: Option<String>,
    pub agent: Option<String>,
    pub auto_invoke: Option<bool>,
    pub is_builtin: Option<bool>,
    pub install_scope: Option<String>,
    pub installed_path: Option<String>,
}

pub async fn upsert(pool: &SqlitePool, input: UpsertSkill) -> Result<Skill, sqlx::Error> {
    let id = input.id.unwrap_or_else(|| Uuid::new_v4().to_string());
    let context = input.context.unwrap_or_else(|| "default".into());
    let auto_invoke = input.auto_invoke.unwrap_or(true) as i64;
    let is_builtin = input.is_builtin.unwrap_or(false) as i64;

    sqlx::query(
        "INSERT INTO skills
         (id, name, display_name, description, category, skill_md, allowed_tools, context,
          agent, auto_invoke, is_builtin, install_scope, installed_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(name) DO UPDATE SET
           display_name   = excluded.display_name,
           description    = excluded.description,
           category       = excluded.category,
           skill_md       = excluded.skill_md,
           allowed_tools  = excluded.allowed_tools,
           context        = excluded.context,
           agent          = excluded.agent,
           auto_invoke    = excluded.auto_invoke,
           install_scope  = excluded.install_scope,
           installed_path = excluded.installed_path,
           updated_at     = strftime('%Y-%m-%dT%H:%M:%SZ','now')",
    )
    .bind(&id)
    .bind(&input.name)
    .bind(&input.display_name)
    .bind(&input.description)
    .bind(&input.category)
    .bind(&input.skill_md)
    .bind(&input.allowed_tools)
    .bind(&context)
    .bind(&input.agent)
    .bind(auto_invoke)
    .bind(is_builtin)
    .bind(&input.install_scope)
    .bind(&input.installed_path)
    .execute(pool)
    .await?;

    find_by_name(pool, &input.name)
        .await?
        .ok_or(sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: &str) -> Result<Option<Skill>, sqlx::Error> {
    sqlx::query_as::<_, Skill>("SELECT * FROM skills WHERE id = ?")
        .bind(id)
        .fetch_optional(pool)
        .await
}

pub async fn find_by_name(pool: &SqlitePool, name: &str) -> Result<Option<Skill>, sqlx::Error> {
    sqlx::query_as::<_, Skill>("SELECT * FROM skills WHERE name = ?")
        .bind(name)
        .fetch_optional(pool)
        .await
}

pub async fn list(pool: &SqlitePool) -> Result<Vec<Skill>, sqlx::Error> {
    sqlx::query_as::<_, Skill>(
        "SELECT * FROM skills ORDER BY category ASC, display_name ASC",
    )
    .fetch_all(pool)
    .await
}

pub async fn list_enabled(pool: &SqlitePool) -> Result<Vec<Skill>, sqlx::Error> {
    sqlx::query_as::<_, Skill>(
        "SELECT * FROM skills WHERE is_enabled = 1 ORDER BY category ASC, display_name ASC",
    )
    .fetch_all(pool)
    .await
}

pub async fn set_enabled(
    pool: &SqlitePool,
    id: &str,
    enabled: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE skills
         SET is_enabled = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
         WHERE id = ?",
    )
    .bind(enabled as i64)
    .bind(id)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete(pool: &SqlitePool, id: &str) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM skills WHERE id = ? AND is_builtin = 0")
        .bind(id)
        .execute(pool)
        .await?;
    Ok(())
}
