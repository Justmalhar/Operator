import { invoke } from "@tauri-apps/api/core";
import type { LogEntry } from "./logger";

// ---------------------------------------------------------------------------
// Greet (scaffold placeholder — remove when real commands are wired in)
// ---------------------------------------------------------------------------

export async function greet(name: string): Promise<string> {
  return invoke<string>("greet", { name });
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

/**
 * Forward a batch of structured frontend log entries to the Rust backend.
 * Prefer using `logger.info/warn/error` directly — this is exposed for
 * advanced use-cases (e.g. custom flush triggers).
 */
export async function logFrontendEvents(entries: LogEntry[]): Promise<void> {
  return invoke("log_frontend_events", { entries });
}
