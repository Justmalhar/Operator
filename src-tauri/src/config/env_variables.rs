//! Environment variable map builder for agent process PTYs.
//!
//! Every time Operator spawns an agent subprocess it calls `build()` to get a
//! fully-resolved `HashMap<String, String>` that should be applied to the
//! child's environment.  The strategy is:
//!
//! 1. Seed the map with the current process's own environment (inherit).
//! 2. Layer Operator-specific variables on top, overriding any inherited
//!    values with the same key.
//!
//! This means agents always see a consistent set of `OPERATOR_*` /
//! `CONDUCTOR_*` variables regardless of what the user's shell exports.

use std::collections::HashMap;

use serde::{Deserialize, Serialize};

// ── Configuration input ───────────────────────────────────────────────────────

/// All the data needed to produce the environment for one agent session.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvConfig {
    /// Unique workspace identifier (UUID string).
    pub workspace_id: String,
    /// Absolute filesystem path to the linked worktree directory.
    pub workspace_path: String,
    /// Absolute filesystem path to the main repository root.
    pub repo_path: String,
    /// Git branch name checked out in this workspace.
    pub branch_name: String,
    /// Primary port number allocated to this workspace.
    pub port_base: u16,
    /// Optional API key (backend-specific).
    pub api_key: Option<String>,
    /// Backend identifier: `"claude"` | `"openai"` | `"gemini"` | etc.
    pub backend: String,
    /// Optional model override (e.g. `"claude-sonnet-4-6"`).
    pub model: Option<String>,
}

// ── Builder ───────────────────────────────────────────────────────────────────

/// Build the environment variable map for an agent PTY session.
///
/// The returned map contains all inherited process environment variables with
/// Operator-specific keys layered on top (and overriding conflicts).
pub fn build(config: &EnvConfig) -> HashMap<String, String> {
    // 1. Inherit from the current process environment.
    let mut env: HashMap<String, String> = std::env::vars().collect();

    // 2. Operator-specific variables — always set.
    env.insert(
        "OPERATOR_WORKSPACE_ID".to_owned(),
        config.workspace_id.clone(),
    );
    env.insert(
        "OPERATOR_WORKSPACE_PATH".to_owned(),
        config.workspace_path.clone(),
    );
    env.insert(
        "OPERATOR_REPO_PATH".to_owned(),
        config.repo_path.clone(),
    );
    env.insert(
        "OPERATOR_BRANCH".to_owned(),
        config.branch_name.clone(),
    );
    env.insert(
        "OPERATOR_PORT".to_owned(),
        config.port_base.to_string(),
    );
    env.insert(
        "OPERATOR_BACKEND".to_owned(),
        config.backend.clone(),
    );

    // 3. Backend-specific API key variable.
    if let Some(ref api_key) = config.api_key {
        match config.backend.to_lowercase().as_str() {
            "claude" | "anthropic" | "claudecode" => {
                env.insert("ANTHROPIC_API_KEY".to_owned(), api_key.clone());
            }
            "openai" | "codex" | "cursor" | "opencode" => {
                env.insert("OPENAI_API_KEY".to_owned(), api_key.clone());
            }
            "gemini" => {
                env.insert("GEMINI_API_KEY".to_owned(), api_key.clone());
            }
            // Unknown backend — set all three so the agent can pick whichever it needs.
            _ => {
                env.insert("ANTHROPIC_API_KEY".to_owned(), api_key.clone());
                env.insert("OPENAI_API_KEY".to_owned(), api_key.clone());
                env.insert("GEMINI_API_KEY".to_owned(), api_key.clone());
            }
        }
    }

    // 4. Optional model hint.
    if let Some(ref model) = config.model {
        env.insert("OPERATOR_MODEL".to_owned(), model.clone());
    }

    // 5. Conductor compatibility aliases (expected by older agent integrations).
    env.insert(
        "CONDUCTOR_WORKSPACE_ID".to_owned(),
        config.workspace_id.clone(),
    );
    env.insert(
        "CONDUCTOR_ROOT_PATH".to_owned(),
        config.repo_path.clone(),
    );
    // Reserved paths — populated by the orchestrator at a higher level if needed.
    env.insert(
        "CONDUCTOR_INT_CHECKPOINTER_PATH".to_owned(),
        String::new(),
    );
    env.insert(
        "CONDUCTOR_INT_WATCHEXEC_PATH".to_owned(),
        String::new(),
    );

    env
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_config(backend: &str, api_key: Option<&str>) -> EnvConfig {
        EnvConfig {
            workspace_id: "ws-001".to_owned(),
            workspace_path: "/workspaces/my-repo/ws-001".to_owned(),
            repo_path: "/workspaces/my-repo".to_owned(),
            branch_name: "feature/test".to_owned(),
            port_base: 3010,
            api_key: api_key.map(|s| s.to_owned()),
            backend: backend.to_owned(),
            model: Some("claude-sonnet-4-6".to_owned()),
        }
    }

    #[test]
    fn required_keys_present() {
        let env = build(&sample_config("claude", Some("sk-ant-test")));
        assert_eq!(env["OPERATOR_WORKSPACE_ID"], "ws-001");
        assert_eq!(env["OPERATOR_PORT"], "3010");
        assert_eq!(env["OPERATOR_BACKEND"], "claude");
        assert_eq!(env["CONDUCTOR_WORKSPACE_ID"], "ws-001");
        assert_eq!(env["CONDUCTOR_ROOT_PATH"], "/workspaces/my-repo");
        assert_eq!(env["CONDUCTOR_INT_CHECKPOINTER_PATH"], "");
        assert_eq!(env["CONDUCTOR_INT_WATCHEXEC_PATH"], "");
    }

    #[test]
    fn anthropic_api_key_set_for_claude_backend() {
        let env = build(&sample_config("claude", Some("sk-ant-xyz")));
        assert_eq!(env.get("ANTHROPIC_API_KEY").map(|s| s.as_str()), Some("sk-ant-xyz"));
        assert!(!env.contains_key("OPENAI_API_KEY"));
        assert!(!env.contains_key("GEMINI_API_KEY"));
    }

    #[test]
    fn openai_api_key_set_for_openai_backend() {
        let env = build(&sample_config("openai", Some("sk-openai-xyz")));
        assert_eq!(env.get("OPENAI_API_KEY").map(|s| s.as_str()), Some("sk-openai-xyz"));
        assert!(!env.contains_key("ANTHROPIC_API_KEY"));
    }

    #[test]
    fn no_api_key_when_none() {
        let env = build(&sample_config("claude", None));
        assert!(!env.contains_key("ANTHROPIC_API_KEY"));
    }
}
