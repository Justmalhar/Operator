# Operator — Logging & Observability

*Version 1.0 · March 2026*

---

## 1. Philosophy

- **Local-first:** No log content leaves the machine unless user opts in to crash reporting
- **Structured:** All logs are structured JSON — machine-parseable, not printf strings
- **Layered:** Rust backend uses `tracing`, React frontend uses a custom `Logger` class that writes to both console and Tauri events
- **Privacy-safe:** Agent messages, source code, and file contents are NEVER logged. Only events, IDs, durations, and error codes.

---

## 2. Rust Backend Logging (tracing)

### 2.1 Setup

```rust
// src-tauri/src/logging.rs
use tracing_subscriber::{fmt, EnvFilter, layer::SubscriberExt, util::SubscriberInitExt};
use tracing_appender::rolling::{RollingFileAppender, Rotation};

pub fn init_logging(log_dir: &Path) {
    let file_appender = RollingFileAppender::new(
        Rotation::DAILY,
        log_dir,
        "operator.log",
    );

    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);

    tracing_subscriber::registry()
        .with(EnvFilter::from_default_env()
            .add_directive("operator=debug".parse().unwrap())
            .add_directive("tauri=warn".parse().unwrap())
            .add_directive("hyper=warn".parse().unwrap()))
        .with(fmt::layer()
            .json()
            .with_writer(non_blocking)
            .with_target(true)
            .with_thread_ids(true))
        .with(fmt::layer()
            .with_writer(std::io::stderr)
            .with_target(false)
            .compact())
        .init();
}
```

### 2.2 Log Levels

| Level | When to use |
|---|---|
| `ERROR` | Operation failed, user action required (PTY crash, git op failure) |
| `WARN` | Unexpected but recoverable (auth token expiring, config missing field) |
| `INFO` | Normal significant events (workspace created, PR created, checkpoint taken) |
| `DEBUG` | Internal state for debugging (IPC command received, file watcher event) |
| `TRACE` | High-frequency data (PTY byte streams — disabled in release builds) |

### 2.3 Instrumented Operations

Every Tauri command is instrumented:

```rust
#[tauri::command]
#[tracing::instrument(skip(state), fields(workspace_id = %workspace_id))]
pub async fn create_workspace(
    state: tauri::State<'_, AppState>,
    workspace_id: String,
    repo_id: String,
) -> Result<Workspace, OperatorError> {
    tracing::info!(repo_id = %repo_id, "creating workspace");

    let result = do_create_workspace(&state, &workspace_id, &repo_id).await;

    match &result {
        Ok(ws) => tracing::info!(
            city_name = %ws.city_name,
            worktree_path = %ws.worktree_path,
            "workspace created successfully"
        ),
        Err(e) => tracing::error!(error = %e, "workspace creation failed"),
    }

    result
}
```

### 2.4 Log File Location

```
macOS:   ~/Library/Logs/Operator/
Windows: %APPDATA%\Operator\Logs\
Linux:   ~/.local/share/Operator/logs/

File naming: operator.YYYY-MM-DD.log
Rotation:    Daily
Retention:   7 days (configurable in Settings → Advanced)
Max size:    50 MB per file (hard limit, older entries dropped)
```

---

## 3. React Frontend Logging

### 3.1 Logger Class

```typescript
// src/lib/logger.ts
type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  timestamp: string;
  component?: string;
}

class OperatorLogger {
  private buffer: LogEntry[] = [];
  private flushInterval: number;

  constructor() {
    // Flush buffer to Rust every 2s
    this.flushInterval = window.setInterval(() => this.flush(), 2000);
  }

  error(message: string, context?: Record<string, unknown>, component?: string) {
    this.log('error', message, context, component);
    // Errors also go to console immediately
    console.error(`[Operator:${component}]`, message, context);
  }

  warn(message: string, context?: Record<string, unknown>, component?: string) {
    this.log('warn', message, context, component);
  }

  info(message: string, context?: Record<string, unknown>, component?: string) {
    this.log('info', message, context, component);
  }

  debug(message: string, context?: Record<string, unknown>, component?: string) {
    if (import.meta.env.DEV) {
      this.log('debug', message, context, component);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, component?: string) {
    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      component,
    };
    this.buffer.push(entry);
  }

  private async flush() {
    if (this.buffer.length === 0) return;
    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await invoke('log_frontend_events', { entries });
    } catch {
      // Don't let logging errors crash the app
      console.warn('[Logger] Failed to flush to backend');
    }
  }
}

export const logger = new OperatorLogger();
```

### 3.2 Component-Level Logging

```typescript
// Example usage in a component
import { logger } from '@/lib/logger';

function WorkspaceItem({ workspace }: WorkspaceItemProps) {
  const handleClick = () => {
    logger.info('workspace selected', {
      workspaceId: workspace.id,
      status: workspace.status,
    }, 'WorkspaceItem');
  };
  // ...
}
```

---

## 4. Audit Log

All user-initiated and agent-initiated actions that modify state are written to the `git_operations_log` table (see `04-database-schema.md`).

Key operations logged:
- Workspace create / archive / delete
- Branch create / push
- PR create
- Checkpoint create / revert
- Script run (setup/run/archive) + exit code
- Hook trigger + decision
- Model/backend switch

```rust
pub async fn write_audit_log(
    db: &SqlitePool,
    workspace_id: Option<&str>,
    operation: &str,
    details: serde_json::Value,
    success: bool,
    error_message: Option<&str>,
    duration_ms: Option<i64>,
) -> Result<()> {
    sqlx::query!(
        r#"INSERT INTO git_operations_log
           (id, workspace_id, operation, details, success, error_message, duration_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?)"#,
        Uuid::new_v4().to_string(),
        workspace_id,
        operation,
        details.to_string(),
        success,
        error_message,
        duration_ms,
    )
    .execute(db)
    .await?;
    Ok(())
}
```

---

## 5. Analytics (PostHog)

Only sent when `enterpriseDataPrivacy !== true` in operator.json.

### 5.1 Events Tracked

| Event | Properties | Notes |
|---|---|---|
| `app_launched` | `version`, `platform`, `os_version` | On every cold start |
| `workspace_created` | `backend`, `source` (branch/pr/issue) | No repo name |
| `agent_started` | `backend`, `model`, `reasoning_level` | |
| `agent_turn_completed` | `duration_ms`, `token_count`, `cost_usd`, `tool_calls_count` | No content |
| `pr_created` | `platform` (github/gitlab), `duration_ms` | |
| `checkpoint_created` | `turn_index` | |
| `checkpoint_reverted` | `turns_back` | How many turns undone |
| `skill_installed` | `skill_id`, `scope` | Only built-in skill IDs |
| `command_used` | `command_id` | |
| `attachment_added` | `type` (image/file) | No file name/content |
| `error_occurred` | `error_type`, `context` | No stack trace in analytics |
| `settings_changed` | `setting_key` | No values |

### 5.2 Never Tracked

- Any file content, code, or diff
- Any agent message content
- Actual filenames or paths
- API keys or credentials
- Repository names or URLs
- Branch names

### 5.3 Implementation

```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

export function trackEvent(
  event: string,
  properties?: Record<string, string | number | boolean>,
) {
  if (!isAnalyticsEnabled()) return;
  posthog.capture(event, {
    ...properties,
    app_version: APP_VERSION,
    platform: navigator.platform,
  });
}

function isAnalyticsEnabled(): boolean {
  return useSettingsStore.getState().analyticsEnabled;
}
```

---

## 6. Crash Reporting (Sentry — Opt-in)

Only enabled if user explicitly enables in Settings → Privacy → Crash Reports.

```rust
// src-tauri/src/crash_reporter.rs
pub fn init_crash_reporter(dsn: &str, enabled: bool) {
    if !enabled { return; }

    sentry::init((dsn, sentry::ClientOptions {
        release: sentry::release_name!(),
        traces_sample_rate: 0.0,  // No performance tracing
        ..Default::default()
    }));
}
```

**Data in crash reports:**
- Stack trace (Rust + JS)
- OS version + app version
- Last 10 log lines (no content, only operation names)
- No file contents, no API keys, no user data

---

## 7. Debug Mode

Accessible via Settings → Advanced → Debug Mode, or launch flag `--debug`.

In debug mode:
- All log levels enabled including TRACE
- `/context` command in workspace shows context window breakdown
- Tool call timing shown in UI
- IPC call timings shown in dev tools
- PostHog events echoed to console
- Settings panel shows raw SQLite query plan

---

## 8. Log Viewer (In-App)

Settings → Advanced → View Logs opens a simple log viewer:

```
┌──────────────────────────────────────────────────────────────┐
│  Operator Logs                    [Filter: all ⌄]  [Export]  │
├──────────────────────────────────────────────────────────────┤
│  2026-03-14 19:37:45  INFO  workspace created  tokyo         │
│  2026-03-14 19:37:46  INFO  agent started  claude-sonnet-4-6 │
│  2026-03-14 19:37:47  DEBUG checkpoint created  turn-001     │
│  2026-03-14 19:38:10  INFO  diff updated  3 files            │
│  2026-03-14 19:38:45  ERROR git push failed  auth-expired    │
└──────────────────────────────────────────────────────────────┘
```

Export: downloads `operator-logs-YYYY-MM-DD.json` (last 24h, no content fields).
