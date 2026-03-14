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
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let handle = app.handle().clone();
            // Initialise DB on the Tauri async runtime.
            let pool = tauri::async_runtime::block_on(async {
                db::schema::init_db(&handle)
                    .await
                    .expect("failed to initialise SQLite database")
            });
            app.manage(AppState { db: pool });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running Operator");
}
