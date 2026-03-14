//! `operator.json` schema parser.
//!
//! `operator.json` is a per-repository configuration file that teams commit to
//! their repo root to declare project-level Operator settings: default model,
//! port, hooks, skills, etc.
//!
//! All fields are optional so that a minimal file (`{}`) is valid and unknown
//! fields are silently ignored (via `#[serde(deny_unknown_fields)]` being
//! intentionally omitted).

use std::path::Path;

use serde::{Deserialize, Serialize};

// ── Schema types ──────────────────────────────────────────────────────────────

/// A reference to a named skill that can be enabled or disabled for this repo.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SkillRef {
    /// Canonical skill name (must match a registered skill identifier).
    pub name: String,
    /// Whether the skill is active in this repository.  Defaults to `true`
    /// when absent.
    pub enabled: Option<bool>,
}

/// A lifecycle hook definition.
///
/// Hooks fire when `event` occurs and the `matcher` pattern (if provided)
/// matches the triggering context (e.g. a file path or message content).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HookDef {
    /// Lifecycle event that triggers this hook.
    ///
    /// Common values: `"pre_commit"`, `"post_commit"`, `"on_message"`,
    /// `"on_tool_call"`, `"on_error"`.
    pub event: String,
    /// Optional regex / glob pattern applied to the triggering context.
    /// Hook fires unconditionally when absent.
    pub matcher: Option<String>,
    /// Shell command or MCP tool name to invoke.
    pub handler: String,
    /// How to interpret `handler`.  One of `"shell"` (default) or `"mcp"`.
    pub handler_type: Option<String>,
}

/// Top-level `operator.json` document.
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OperatorJson {
    /// Schema version string (informational, not enforced).
    pub version: Option<String>,
    /// Default model to use in this repository (overrides app-level setting).
    pub default_model: Option<String>,
    /// Default backend to use in this repository.
    pub default_backend: Option<String>,
    /// Reasoning level hint passed to the backend (`"low"` / `"medium"` / `"high"`).
    pub reasoning_level: Option<String>,
    /// Base port override for this repository.
    pub base_port: Option<u16>,
    /// Skill references that apply to this repository.
    pub skills: Option<Vec<SkillRef>>,
    /// Lifecycle hooks defined for this repository.
    pub hooks: Option<Vec<HookDef>>,
    /// When `true`, data must not leave the organisation's infrastructure.
    pub enterprise_data_privacy: Option<bool>,
    /// Explicit allowlist of tool names the agent may use.
    /// An absent or empty list means all tools are permitted.
    pub allowed_tools: Option<Vec<String>>,
    /// Override the auto-checkpoint setting for this repository.
    pub auto_checkpoint: Option<bool>,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Deserialise an `operator.json` document from a JSON string.
pub fn parse(json_str: &str) -> Result<OperatorJson, serde_json::Error> {
    serde_json::from_str(json_str)
}

/// Serialise an `OperatorJson` to a pretty-printed JSON string.
pub fn to_json(config: &OperatorJson) -> Result<String, serde_json::Error> {
    serde_json::to_string_pretty(config)
}

/// Attempt to load and parse `<repo_path>/operator.json`.
///
/// Returns `None` if:
/// - the file does not exist,
/// - it cannot be read (permissions, I/O error), or
/// - its contents are not valid JSON / do not match the schema.
///
/// Errors are intentionally swallowed because a missing or malformed
/// `operator.json` is a normal condition — callers should gracefully fall back
/// to app-level defaults.
pub fn load_from_repo(repo_path: &Path) -> Option<OperatorJson> {
    let file_path = repo_path.join("operator.json");

    let contents = std::fs::read_to_string(&file_path)
        .map_err(|e| {
            tracing::debug!(
                path = %file_path.display(),
                error = %e,
                "operator.json not readable"
            );
        })
        .ok()?;

    parse(&contents)
        .map_err(|e| {
            tracing::warn!(
                path = %file_path.display(),
                error = %e,
                "operator.json parse error — ignoring"
            );
        })
        .ok()
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn empty_object_parses_to_defaults() {
        let cfg = parse("{}").unwrap();
        assert!(cfg.version.is_none());
        assert!(cfg.default_model.is_none());
        assert!(cfg.skills.is_none());
    }

    #[test]
    fn full_document_round_trips() {
        let json = r#"
        {
            "version": "1",
            "default_model": "claude-sonnet-4-6",
            "default_backend": "claude",
            "reasoning_level": "high",
            "base_port": 4000,
            "enterprise_data_privacy": true,
            "auto_checkpoint": false,
            "allowed_tools": ["read_file", "write_file"],
            "skills": [
                { "name": "search", "enabled": true },
                { "name": "browser", "enabled": false }
            ],
            "hooks": [
                {
                    "event": "pre_commit",
                    "matcher": "*.rs",
                    "handler": "cargo fmt --check",
                    "handler_type": "shell"
                }
            ]
        }
        "#;

        let cfg = parse(json).unwrap();
        assert_eq!(cfg.version.as_deref(), Some("1"));
        assert_eq!(cfg.default_model.as_deref(), Some("claude-sonnet-4-6"));
        assert_eq!(cfg.base_port, Some(4000));
        assert_eq!(cfg.enterprise_data_privacy, Some(true));

        let skills = cfg.skills.as_ref().unwrap();
        assert_eq!(skills.len(), 2);
        assert_eq!(skills[0].name, "search");

        let hooks = cfg.hooks.as_ref().unwrap();
        assert_eq!(hooks[0].event, "pre_commit");
        assert_eq!(hooks[0].handler_type.as_deref(), Some("shell"));

        // Round-trip through serialise → deserialise.
        let serialised = to_json(&cfg).unwrap();
        let cfg2 = parse(&serialised).unwrap();
        assert_eq!(cfg2.default_model, cfg.default_model);
        assert_eq!(cfg2.base_port, cfg.base_port);
    }

    #[test]
    fn unknown_fields_are_ignored() {
        let json = r#"{ "unknown_future_field": 42, "version": "2" }"#;
        let cfg = parse(json).unwrap();
        assert_eq!(cfg.version.as_deref(), Some("2"));
    }

    #[test]
    fn invalid_json_returns_error() {
        assert!(parse("not json").is_err());
    }

    #[test]
    fn load_from_nonexistent_repo_returns_none() {
        let result = load_from_repo(Path::new("/nonexistent/path/that/does/not/exist"));
        assert!(result.is_none());
    }
}
