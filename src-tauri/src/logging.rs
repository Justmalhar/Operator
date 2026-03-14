use std::path::Path;
use std::sync::OnceLock;

use serde::Deserialize;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

/// Keeps the non-blocking writer guard alive for the process lifetime.
static _GUARD: OnceLock<tracing_appender::non_blocking::WorkerGuard> = OnceLock::new();

/// Initialise structured logging.
///
/// - JSON log lines go to a daily-rotated file under `log_dir`.
/// - Compact human-readable lines go to stderr (dev builds only).
pub fn init_logging(log_dir: &Path) {
    let file_appender = RollingFileAppender::new(Rotation::DAILY, log_dir, "operator.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(file_appender);

    // Keep the guard alive so the background thread doesn't drop.
    _GUARD.get_or_init(|| guard);

    let file_layer = fmt::layer()
        .json()
        .with_writer(non_blocking)
        .with_target(true)
        .with_thread_ids(true);

    let stderr_layer = fmt::layer()
        .with_writer(std::io::stderr)
        .with_target(false)
        .compact();

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        EnvFilter::new("")
            .add_directive("operator=debug".parse().unwrap())
            .add_directive("tauri=warn".parse().unwrap())
            .add_directive("hyper=warn".parse().unwrap())
    });

    tracing_subscriber::registry()
        .with(filter)
        .with(file_layer)
        .with(stderr_layer)
        .init();

    tracing::info!(log_dir = %log_dir.display(), "logging initialised");
}

// ---------------------------------------------------------------------------
// Frontend log ingestion
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FrontendLogEntry {
    pub level: String,
    pub message: String,
    pub component: Option<String>,
    pub context: Option<serde_json::Value>,
    pub timestamp: String,
}

/// Tauri command: accepts a batch of structured log entries from the React
/// frontend and re-emits them through the `tracing` subscriber so they land
/// in the same rotating log file as backend events.
#[tauri::command]
pub fn log_frontend_events(entries: Vec<FrontendLogEntry>) {
    for entry in entries {
        let component = entry.component.as_deref().unwrap_or("frontend");
        let ctx = entry
            .context
            .as_ref()
            .map(|v| v.to_string())
            .unwrap_or_default();

        match entry.level.as_str() {
            "error" => tracing::error!(
                component,
                context = %ctx,
                ts = %entry.timestamp,
                "[fe] {}",
                entry.message
            ),
            "warn" => tracing::warn!(
                component,
                context = %ctx,
                ts = %entry.timestamp,
                "[fe] {}",
                entry.message
            ),
            "info" => tracing::info!(
                component,
                context = %ctx,
                ts = %entry.timestamp,
                "[fe] {}",
                entry.message
            ),
            "debug" => tracing::debug!(
                component,
                context = %ctx,
                ts = %entry.timestamp,
                "[fe] {}",
                entry.message
            ),
            "trace" => tracing::trace!(
                component,
                context = %ctx,
                ts = %entry.timestamp,
                "[fe] {}",
                entry.message
            ),
            _ => tracing::info!(
                component,
                context = %ctx,
                ts = %entry.timestamp,
                "[fe] {}",
                entry.message
            ),
        }
    }
}
