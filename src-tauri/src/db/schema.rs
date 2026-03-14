use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use tauri::Manager;

/// Initialise the SQLite connection pool, apply PRAGMAs, and run migrations.
pub async fn init_db(app: &tauri::AppHandle) -> Result<SqlitePool, sqlx::Error> {
    let db_path = app
        .path()
        .app_data_dir()
        .expect("failed to resolve app_data_dir")
        .join("operator.db");

    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent)
            .expect("failed to create app data directory");
    }

    let db_url = format!(
        "sqlite://{}?mode=rwc",
        db_path.to_string_lossy()
    );

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;

    // SQLite tuning
    sqlx::query("PRAGMA journal_mode = WAL").execute(&pool).await?;
    sqlx::query("PRAGMA foreign_keys = ON").execute(&pool).await?;
    sqlx::query("PRAGMA synchronous = NORMAL").execute(&pool).await?;
    sqlx::query("PRAGMA cache_size = -64000").execute(&pool).await?;

    // Run migrations from src-tauri/migrations/
    sqlx::migrate!("./migrations").run(&pool).await
        .map_err(|e| sqlx::Error::Configuration(e.to_string().into()))?;

    Ok(pool)
}
