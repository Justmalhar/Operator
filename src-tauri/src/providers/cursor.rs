use std::collections::HashMap;

use super::{AgentArgs, LaunchConfig};

/// Build PTY launch arguments for the Cursor CLI (`cursor`).
pub fn build_args(config: &LaunchConfig) -> AgentArgs {
    let program = which::which("cursor")
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "cursor".to_string());

    let mut args: Vec<String> = Vec::new();

    // Open the workspace directory directly.
    args.push(
        config
            .worktree_path
            .to_string_lossy()
            .into_owned(),
    );

    if let Some(ref prompt) = config.initial_prompt {
        // Pass the initial instruction via a flag if the CLI supports it;
        // otherwise expose through the environment variable fallback below.
        args.push("--task".to_string());
        args.push(prompt.clone());
    }

    let mut env: HashMap<String, String> = HashMap::new();

    if let Some(ref key) = config.api_key {
        env.insert("CURSOR_API_KEY".to_string(), key.clone());
    }

    env.insert(
        "OPERATOR_WORKSPACE_ID".to_string(),
        config.workspace_id.clone(),
    );
    env.insert(
        "OPERATOR_PORT".to_string(),
        config.port_base.to_string(),
    );

    if let Some(ref prompt) = config.initial_prompt {
        env.insert("OPERATOR_INITIAL_PROMPT".to_string(), prompt.clone());
    }

    AgentArgs { program, args, env }
}
