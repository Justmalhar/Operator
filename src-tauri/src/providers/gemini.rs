use std::collections::HashMap;

use super::{AgentArgs, LaunchConfig};

/// Build PTY launch arguments for the Google Gemini CLI (`gemini`).
pub fn build_args(config: &LaunchConfig) -> AgentArgs {
    let program = which::which("gemini")
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|_| "gemini".to_string());

    let mut args: Vec<String> = Vec::new();

    if let Some(ref model) = config.model {
        args.push("--model".to_string());
        args.push(model.clone());
    }

    if let Some(ref prompt) = config.initial_prompt {
        // Gemini CLI accepts the prompt as a positional argument.
        args.push(prompt.clone());
    }

    let mut env: HashMap<String, String> = HashMap::new();

    if let Some(ref key) = config.api_key {
        env.insert("GEMINI_API_KEY".to_string(), key.clone());
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
