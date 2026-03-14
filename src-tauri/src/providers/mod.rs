pub mod claudecode;
pub mod codex;
pub mod cursor;
pub mod gemini;
pub mod opencode;

use std::collections::HashMap;
use serde::{Deserialize, Serialize};

/// Arguments needed to launch an agent process in a PTY.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentArgs {
    pub program: String,
    pub args: Vec<String>,
    pub env: HashMap<String, String>,
}

/// Configuration passed to each provider's build function.
#[derive(Debug, Clone)]
pub struct LaunchConfig {
    pub workspace_id: String,
    pub worktree_path: std::path::PathBuf,
    pub branch_name: String,
    pub model: Option<String>,
    pub reasoning_level: Option<String>, // "low" | "medium" | "high"
    pub api_key: Option<String>,
    pub port_base: u16,
    pub initial_prompt: Option<String>,
}

/// Dispatch to the correct provider based on `backend` string.
pub fn build_args(
    backend: &str,
    config: &LaunchConfig,
) -> Result<AgentArgs, crate::error::AppError> {
    match backend {
        "claude" | "claudecode" => Ok(claudecode::build_args(config)),
        "codex" => Ok(codex::build_args(config)),
        "cursor" => Ok(cursor::build_args(config)),
        "gemini" => Ok(gemini::build_args(config)),
        "opencode" => Ok(opencode::build_args(config)),
        other => Err(crate::error::AppError::msg(format!(
            "unknown agent backend: {other}"
        ))),
    }
}
