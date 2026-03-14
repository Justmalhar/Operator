use std::collections::HashMap;

use super::{AgentArgs, LaunchConfig};

/// Build PTY launch arguments for the Claude Code CLI (`claude`).
pub fn build_args(config: &LaunchConfig) -> AgentArgs {
    // Resolve the binary path; fall back to bare name if `which` fails.
    let program = which::which("claude")
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "claude".to_string());

    let mut args: Vec<String> = Vec::new();

    // Skip interactive permission prompts — required for headless agent mode.
    args.push("--dangerously-skip-permissions".to_string());

    // Suppress update banners so PTY output stays parseable.
    args.push("--no-update-notifier".to_string());

    // Optional model override.
    if let Some(ref model) = config.model {
        args.push("--model".to_string());
        args.push(model.clone());
    }

    // Non-interactive mode: print response and exit when an initial prompt
    // is supplied. This is the standard way to drive claude non-interactively.
    if let Some(ref prompt) = config.initial_prompt {
        args.push("--print".to_string());
        args.push(prompt.clone());
    }

    // Build environment map.
    let mut env: HashMap<String, String> = HashMap::new();

    if let Some(ref key) = config.api_key {
        env.insert("ANTHROPIC_API_KEY".to_string(), key.clone());
    }

    env.insert(
        "OPERATOR_WORKSPACE_ID".to_string(),
        config.workspace_id.clone(),
    );
    env.insert(
        "OPERATOR_PORT".to_string(),
        config.port_base.to_string(),
    );

    // Also expose the initial prompt as an env var so hooks/scripts can read it.
    if let Some(ref prompt) = config.initial_prompt {
        env.insert("OPERATOR_INITIAL_PROMPT".to_string(), prompt.clone());
    }

    AgentArgs { program, args, env }
}
