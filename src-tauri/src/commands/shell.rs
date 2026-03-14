//! Tauri commands for running arbitrary shell commands/scripts.
//!
//! Used by the hook system (post-commit scripts, custom tool wrappers) and
//! by the UI for one-shot shell invocations.
//!
//! Both commands support optional `env` overrides and `cwd`; the provided env
//! is *merged* over the current process environment so that `PATH` etc. remain
//! available.  A `timeout_ms` guard prevents runaway processes.

use std::collections::HashMap;
use std::time::Duration;

use serde::{Deserialize, Serialize};

use crate::error::AppError;

// ── Types ─────────────────────────────────────────────────────────────────────

/// Output captured from a finished shell process.
#[derive(Debug, Serialize, Deserialize)]
pub struct ShellOutput {
    pub stdout: String,
    pub stderr: String,
    pub exit_code: i32,
    pub success: bool,
}

// ── Commands ──────────────────────────────────────────────────────────────────

/// Run an executable with explicit arguments in a given working directory.
///
/// `env` entries are merged over the current process environment.
/// `timeout_ms` defaults to 30 000 ms when not provided.
#[tauri::command]
pub async fn run_shell_command(
    command: String,
    args: Vec<String>,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
    timeout_ms: Option<u64>,
) -> Result<ShellOutput, AppError> {
    let timeout = Duration::from_millis(timeout_ms.unwrap_or(30_000));

    let cwd_owned = cwd.clone();
    let env_owned = env.clone();
    let command_owned = command.clone();
    let args_owned = args.clone();

    let task = tokio::task::spawn_blocking(move || {
        let mut cmd = std::process::Command::new(&command_owned);
        cmd.args(&args_owned);

        // Set working directory.
        if let Some(dir) = &cwd_owned {
            cmd.current_dir(dir);
        }

        // Merge provided env vars over the current process env.
        // We collect the current env first, then overlay the caller-supplied map.
        let mut full_env: HashMap<String, String> = std::env::vars().collect();
        if let Some(extra) = env_owned {
            full_env.extend(extra);
        }
        cmd.envs(&full_env);

        cmd.output()
    });

    let output = tokio::time::timeout(timeout, task)
        .await
        .map_err(|_| AppError::msg(format!("command timed out after {}ms", timeout_ms.unwrap_or(30_000))))?
        .map_err(|e| AppError::msg(format!("spawn_blocking error: {e}")))?
        .map_err(AppError::Io)?;

    let exit_code = output.status.code().unwrap_or(-1);

    Ok(ShellOutput {
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        exit_code,
        success: output.status.success(),
    })
}

/// Run a shell script string via `sh -c <script>`.
///
/// Equivalent to `run_shell_command("sh", ["-c", script], cwd, env, None)` but
/// more ergonomic for multi-step hook scripts.
#[tauri::command]
pub async fn run_shell_script(
    script: String,
    cwd: Option<String>,
    env: Option<HashMap<String, String>>,
) -> Result<ShellOutput, AppError> {
    let cwd_owned = cwd.clone();
    let env_owned = env.clone();
    let script_owned = script.clone();

    let task = tokio::task::spawn_blocking(move || {
        let mut cmd = std::process::Command::new("sh");
        cmd.args(["-c", &script_owned]);

        if let Some(dir) = &cwd_owned {
            cmd.current_dir(dir);
        }

        let mut full_env: HashMap<String, String> = std::env::vars().collect();
        if let Some(extra) = env_owned {
            full_env.extend(extra);
        }
        cmd.envs(&full_env);

        cmd.output()
    });

    // Default 30-second timeout for scripts.
    let output = tokio::time::timeout(Duration::from_secs(30), task)
        .await
        .map_err(|_| AppError::msg("shell script timed out after 30s"))?
        .map_err(|e| AppError::msg(format!("spawn_blocking error: {e}")))?
        .map_err(AppError::Io)?;

    let exit_code = output.status.code().unwrap_or(-1);

    Ok(ShellOutput {
        stdout: String::from_utf8_lossy(&output.stdout).into_owned(),
        stderr: String::from_utf8_lossy(&output.stderr).into_owned(),
        exit_code,
        success: output.status.success(),
    })
}
