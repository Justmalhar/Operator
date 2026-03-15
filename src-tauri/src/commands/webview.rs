//! Tauri commands for native child-webview management.
//!
//! The frontend creates child webviews for the browser panel via the JS Webview
//! API, but navigation after creation requires an IPC round-trip through Rust
//! because the JS Webview class does not expose a `navigate()` method directly.

use tauri::Manager;

use crate::error::AppError;

/// Navigate an existing child webview window (identified by `label`) to `url`.
///
/// Silently succeeds if no webview with the given label exists (e.g. it was
/// already closed before the command arrived).
#[tauri::command]
pub async fn navigate_webview(
    app: tauri::AppHandle,
    label: String,
    url: String,
) -> Result<(), AppError> {
    let parsed = url
        .parse::<tauri::Url>()
        .map_err(|e| AppError::msg(format!("invalid URL: {e}")))?;

    if let Some(webview) = app.get_webview_window(&label) {
        webview
            .navigate(parsed)
            .map_err(|e: tauri::Error| AppError::msg(e.to_string()))?;
    }

    Ok(())
}

/// Close an existing child webview window (identified by `label`).
///
/// Using a Rust-side close is more reliable than calling WebviewWindow.close()
/// from JS, because the JS method uses a self-close permission that does not
/// apply when closing another window from the parent context.
///
/// Silently succeeds if no webview with the given label exists.
#[tauri::command]
pub async fn close_webview(app: tauri::AppHandle, label: String) -> Result<(), AppError> {
    if let Some(webview) = app.get_webview_window(&label) {
        webview
            .close()
            .map_err(|e: tauri::Error| AppError::msg(e.to_string()))?;
    }
    Ok(())
}
