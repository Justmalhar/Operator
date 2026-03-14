mod logging;

use tauri::Manager;

#[tauri::command]
#[tracing::instrument(fields(name = %name))]
fn greet(name: &str) -> String {
    tracing::info!("greet invoked");
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            // Resolve platform log directory via Tauri path API, then init tracing.
            let log_dir = app.path().app_log_dir()?;
            std::fs::create_dir_all(&log_dir)?;
            logging::init_logging(&log_dir);
            Ok(())
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, logging::log_frontend_events])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
