mod logging;

pub mod commands;
pub mod config;
pub mod db;
pub mod error;
pub mod git;
pub mod ports;
pub mod providers;
pub mod pty;
pub mod watcher;

use sqlx::SqlitePool;
use tauri::Manager;

/// Shared application state injected into every Tauri command via `tauri::State<AppState>`.
pub struct AppState {
    pub db: SqlitePool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Init tracing first so all subsequent setup steps are observable.
            let log_dir = app.path().app_log_dir()?;
            std::fs::create_dir_all(&log_dir)?;
            logging::init_logging(&log_dir);

            let handle = app.handle().clone();
            let pool = tauri::async_runtime::block_on(async {
                db::schema::init_db(&handle)
                    .await
                    .expect("failed to initialise SQLite database")
            });
            app.manage(AppState { db: pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![logging::log_frontend_events])
        .run(tauri::generate_context!())
        .expect("error while running Operator");
}
