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

use std::sync::{Arc, Mutex};

use sqlx::SqlitePool;
use tauri::Manager;

/// Shared application state injected into every Tauri command via `tauri::State<AppState>`.
pub struct AppState {
    pub db: SqlitePool,
    pub pty_manager: Arc<Mutex<pty::manager::PtyManager>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            // Init tracing — tolerate failures so the app still launches.
            match app.path().app_log_dir() {
                Ok(log_dir) => {
                    if let Err(e) = std::fs::create_dir_all(&log_dir) {
                        eprintln!("[operator] failed to create log directory: {e}");
                    } else {
                        logging::init_logging(&log_dir);
                    }
                }
                Err(e) => {
                    eprintln!("[operator] failed to resolve app_log_dir: {e}");
                }
            }

            let handle = app.handle().clone();
            let pool = tauri::async_runtime::block_on(async {
                match db::schema::init_db(&handle).await {
                    Ok(pool) => pool,
                    Err(e) => {
                        eprintln!("[operator] failed to initialise SQLite database: {e}");
                        // Return a fallback in-memory pool so the app can still render
                        // the frontend even if persistent storage is unavailable.
                        sqlx::sqlite::SqlitePoolOptions::new()
                            .connect("sqlite::memory:")
                            .await
                            .expect("failed to create in-memory SQLite fallback")
                    }
                }
            });

            app.manage(AppState {
                db: pool,
                pty_manager: Arc::new(Mutex::new(pty::manager::PtyManager::new())),
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            logging::log_frontend_events,
            // ── Checkpoint ────────────────────────────────────────────────────
            commands::checkpoint::save_checkpoint,
            commands::checkpoint::restore_checkpoint,
            commands::checkpoint::diff_checkpoints,
            commands::checkpoint::list_checkpoints,
            commands::checkpoint::checkpoint_busy_state,
            commands::checkpoint::delete_checkpoint,
            // ── Workspace / Repository ────────────────────────────────────────
            commands::workspace::list_repositories,
            commands::workspace::add_repository,
            commands::workspace::remove_repository,
            commands::workspace::list_workspaces,
            commands::workspace::get_workspace,
            commands::workspace::create_workspace,
            commands::workspace::delete_workspace,
            commands::workspace::archive_workspace,
            commands::workspace::set_workspace_status,
            // ── Agent ─────────────────────────────────────────────────────────
            commands::agent::launch_agent,
            commands::agent::stop_agent,
            commands::agent::send_agent_input,
            commands::agent::is_agent_running,
            commands::agent::list_active_agents,
            // ── Git ───────────────────────────────────────────────────────────
            commands::git::get_git_status,
            commands::git::get_git_diff,
            commands::git::get_staged_diff,
            commands::git::get_diff_between_revs,
            commands::git::get_file_diff,
            commands::git::get_git_log,
            commands::git::get_current_branch,
            commands::git::git_stage,
            commands::git::git_unstage,
            commands::git::git_discard,
            commands::git::git_commit,
            commands::git::git_push,
            // ── Terminal ──────────────────────────────────────────────────────
            commands::terminal::terminal_write,
            commands::terminal::terminal_resize,
            // ── File system ───────────────────────────────────────────────────
            commands::file::read_file,
            commands::file::write_file,
            commands::file::list_directory,
            commands::file::file_exists,
            commands::file::delete_file,
            // ── Hooks ─────────────────────────────────────────────────────────
            commands::hook::list_hooks,
            commands::hook::create_hook,
            commands::hook::delete_hook,
            commands::hook::set_hook_enabled,
            commands::hook::update_hook_handler,
            // ── Skills ────────────────────────────────────────────────────────
            commands::skill::list_skills,
            commands::skill::upsert_skill,
            commands::skill::set_skill_enabled,
            commands::skill::delete_skill,
            commands::skill::get_skill_by_name,
            // ── Settings / Automations / Memory ───────────────────────────────
            commands::settings::get_setting,
            commands::settings::set_setting,
            commands::settings::delete_setting,
            commands::settings::get_all_settings,
            commands::settings::list_automations,
            commands::settings::create_automation,
            commands::settings::delete_automation,
            commands::settings::list_memory_notes,
            commands::settings::create_memory_note,
            commands::settings::delete_memory_note,
            // ── Shell ─────────────────────────────────────────────────────────
            commands::shell::run_shell_command,
            commands::shell::run_shell_script,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Operator");
}
