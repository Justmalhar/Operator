use std::io::Read;

use serde::Serialize;
use tauri::Emitter;

/// Payload emitted on the `agent_output` event.
#[derive(Debug, Clone, Serialize)]
pub struct AgentOutputPayload {
    pub workspace_id: String,
    /// Raw bytes decoded as UTF-8 (lossy). May contain ANSI escape sequences.
    pub data: String,
}

/// Payload emitted on the `agent_exited` event.
#[derive(Debug, Clone, Serialize)]
pub struct AgentExitedPayload {
    pub workspace_id: String,
    pub exit_code: Option<i32>,
}

/// Spawn a background thread that continuously reads from `reader` and emits
/// `agent_output` Tauri events to all windows. When the reader returns EOF or
/// encounters an error, a final `agent_exited` event is emitted and the thread
/// terminates.
pub fn spawn_reader(
    workspace_id: String,
    mut reader: Box<dyn Read + Send>,
    app_handle: tauri::AppHandle,
) -> std::thread::JoinHandle<()> {
    std::thread::spawn(move || {
        let mut buf = [0u8; 4096];

        loop {
            match reader.read(&mut buf) {
                Ok(0) => {
                    // EOF — the PTY slave was closed (process exited).
                    let _ = app_handle.emit(
                        "agent_exited",
                        AgentExitedPayload {
                            workspace_id: workspace_id.clone(),
                            exit_code: None,
                        },
                    );
                    break;
                }
                Ok(n) => {
                    let data = String::from_utf8_lossy(&buf[..n]).into_owned();
                    let _ = app_handle.emit(
                        "agent_output",
                        AgentOutputPayload {
                            workspace_id: workspace_id.clone(),
                            data,
                        },
                    );
                }
                Err(_) => {
                    // I/O error — treat the same as EOF.
                    let _ = app_handle.emit(
                        "agent_exited",
                        AgentExitedPayload {
                            workspace_id: workspace_id.clone(),
                            exit_code: None,
                        },
                    );
                    break;
                }
            }
        }
    })
}
