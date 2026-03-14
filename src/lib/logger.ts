import { invoke } from "@tauri-apps/api/core";

export type LogLevel = "error" | "warn" | "info" | "debug" | "trace";

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  component?: string;
}

/**
 * Structured, privacy-safe logger for the React frontend.
 *
 * - Buffers entries in memory and flushes to the Rust backend every 2 s via
 *   the `log_frontend_events` Tauri command, where they are written to the
 *   same daily-rotated JSON file as backend events.
 * - `error()` also writes to the browser console immediately.
 * - `debug()` is a no-op in production builds.
 * - NEVER log agent message content, file contents, or credentials.
 */
class OperatorLogger {
  private buffer: LogEntry[] = [];
  private readonly flushIntervalId: ReturnType<typeof setInterval>;

  constructor() {
    this.flushIntervalId = setInterval(() => this.flush(), 2_000);
  }

  error(
    message: string,
    context?: Record<string, unknown>,
    component?: string,
  ): void {
    console.error(`[Operator:${component ?? "app"}]`, message, context ?? "");
    this.push("error", message, context, component);
  }

  warn(
    message: string,
    context?: Record<string, unknown>,
    component?: string,
  ): void {
    this.push("warn", message, context, component);
  }

  info(
    message: string,
    context?: Record<string, unknown>,
    component?: string,
  ): void {
    this.push("info", message, context, component);
  }

  debug(
    message: string,
    context?: Record<string, unknown>,
    component?: string,
  ): void {
    if (import.meta.env.DEV) {
      this.push("debug", message, context, component);
    }
  }

  trace(
    message: string,
    context?: Record<string, unknown>,
    component?: string,
  ): void {
    if (import.meta.env.DEV) {
      this.push("trace", message, context, component);
    }
  }

  /** Force-flush the buffer. Useful before app shutdown or on errors. */
  async flushNow(): Promise<void> {
    return this.flush();
  }

  /** Stop the periodic flush timer (call on app teardown). */
  destroy(): void {
    clearInterval(this.flushIntervalId);
  }

  private push(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    component?: string,
  ): void {
    this.buffer.push({
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      component,
    });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = this.buffer.splice(0, this.buffer.length);

    try {
      await invoke("log_frontend_events", { entries });
    } catch {
      // Never let logging failures crash the app.
      console.warn("[Logger] Failed to flush log entries to backend");
    }
  }
}

export const logger = new OperatorLogger();
