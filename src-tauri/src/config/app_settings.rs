//! Typed settings layer over `db::variables::setting_get / setting_set`.
//!
//! All persisted settings live in the `settings` SQLite table as `(key, value)`
//! string pairs.  This module provides:
//!   - well-known key constants
//!   - a typed `AppSettings` snapshot struct
//!   - async load / per-key mutator helpers

use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

use crate::db::variables::{setting_get, setting_set};

// ── Well-known setting keys ───────────────────────────────────────────────────

pub const KEY_BASE_PORT: &str = "base_port";
pub const KEY_THEME: &str = "theme";
pub const KEY_DEFAULT_BACKEND: &str = "default_backend";
pub const KEY_DEFAULT_MODEL: &str = "default_model";
pub const KEY_TELEMETRY_ENABLED: &str = "telemetry_enabled";
pub const KEY_AUTO_CHECKPOINT: &str = "auto_checkpoint";
pub const KEY_API_KEY_ANTHROPIC: &str = "api_key_anthropic";
pub const KEY_API_KEY_OPENAI: &str = "api_key_openai";
pub const KEY_API_KEY_GEMINI: &str = "api_key_gemini";

// ── Default values ────────────────────────────────────────────────────────────

const DEFAULT_BASE_PORT: u16 = 3000;
const DEFAULT_THEME: &str = "dark";
const DEFAULT_BACKEND: &str = "claude";
const DEFAULT_MODEL: &str = "claude-sonnet-4-6";
const DEFAULT_TELEMETRY: bool = true;
const DEFAULT_AUTO_CHECKPOINT: bool = false;

// ── Typed snapshot ────────────────────────────────────────────────────────────

/// A point-in-time snapshot of the application-level settings.
///
/// API keys are intentionally excluded from this struct — they are loaded
/// individually via `setting_get` when needed to avoid unnecessary exposure.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub base_port: u16,
    pub theme: String,
    pub default_backend: String,
    pub default_model: String,
    pub telemetry_enabled: bool,
    pub auto_checkpoint: bool,
}

impl Default for AppSettings {
    fn default() -> Self {
        Self {
            base_port: DEFAULT_BASE_PORT,
            theme: DEFAULT_THEME.to_owned(),
            default_backend: DEFAULT_BACKEND.to_owned(),
            default_model: DEFAULT_MODEL.to_owned(),
            telemetry_enabled: DEFAULT_TELEMETRY,
            auto_checkpoint: DEFAULT_AUTO_CHECKPOINT,
        }
    }
}

// ── Loader ────────────────────────────────────────────────────────────────────

/// Load all known settings from the database, falling back to sensible
/// defaults for any key that has not yet been persisted.
pub async fn load(pool: &SqlitePool) -> Result<AppSettings, sqlx::Error> {
    let base_port = setting_get(pool, KEY_BASE_PORT)
        .await?
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(DEFAULT_BASE_PORT);

    let theme = setting_get(pool, KEY_THEME)
        .await?
        .unwrap_or_else(|| DEFAULT_THEME.to_owned());

    let default_backend = setting_get(pool, KEY_DEFAULT_BACKEND)
        .await?
        .unwrap_or_else(|| DEFAULT_BACKEND.to_owned());

    let default_model = setting_get(pool, KEY_DEFAULT_MODEL)
        .await?
        .unwrap_or_else(|| DEFAULT_MODEL.to_owned());

    let telemetry_enabled = setting_get(pool, KEY_TELEMETRY_ENABLED)
        .await?
        .map(|v| v != "false" && v != "0")
        .unwrap_or(DEFAULT_TELEMETRY);

    let auto_checkpoint = setting_get(pool, KEY_AUTO_CHECKPOINT)
        .await?
        .map(|v| v == "true" || v == "1")
        .unwrap_or(DEFAULT_AUTO_CHECKPOINT);

    Ok(AppSettings {
        base_port,
        theme,
        default_backend,
        default_model,
        telemetry_enabled,
        auto_checkpoint,
    })
}

// ── Per-key mutators ──────────────────────────────────────────────────────────

/// Persist a new base port value.
pub async fn set_base_port(pool: &SqlitePool, port: u16) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_BASE_PORT, &port.to_string()).await
}

/// Persist the UI theme (e.g. `"dark"`, `"light"`, `"system"`).
pub async fn set_theme(pool: &SqlitePool, theme: &str) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_THEME, theme).await
}

/// Persist the default AI backend (e.g. `"claude"`, `"openai"`, `"gemini"`).
pub async fn set_default_backend(pool: &SqlitePool, backend: &str) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_DEFAULT_BACKEND, backend).await
}

/// Persist the default model name.
pub async fn set_default_model(pool: &SqlitePool, model: &str) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_DEFAULT_MODEL, model).await
}

/// Persist the telemetry opt-in flag.
pub async fn set_telemetry_enabled(pool: &SqlitePool, enabled: bool) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_TELEMETRY_ENABLED, if enabled { "true" } else { "false" }).await
}

/// Persist the auto-checkpoint flag.
pub async fn set_auto_checkpoint(pool: &SqlitePool, enabled: bool) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_AUTO_CHECKPOINT, if enabled { "true" } else { "false" }).await
}

/// Persist an Anthropic API key.
pub async fn set_api_key_anthropic(pool: &SqlitePool, key: &str) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_API_KEY_ANTHROPIC, key).await
}

/// Persist an OpenAI API key.
pub async fn set_api_key_openai(pool: &SqlitePool, key: &str) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_API_KEY_OPENAI, key).await
}

/// Persist a Gemini API key.
pub async fn set_api_key_gemini(pool: &SqlitePool, key: &str) -> Result<(), sqlx::Error> {
    setting_set(pool, KEY_API_KEY_GEMINI, key).await
}

/// Retrieve a single API key by backend name (`"claude"` / `"openai"` / `"gemini"`).
pub async fn get_api_key_for_backend(
    pool: &SqlitePool,
    backend: &str,
) -> Result<Option<String>, sqlx::Error> {
    let key = match backend {
        "claude" | "anthropic" => KEY_API_KEY_ANTHROPIC,
        "openai" | "codex" => KEY_API_KEY_OPENAI,
        "gemini" => KEY_API_KEY_GEMINI,
        _ => return Ok(None),
    };
    setting_get(pool, key).await
}
