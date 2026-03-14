# Operator — Database Schema

*Version 1.0 · March 2026 · SQLite via sqlx*

---

## 1. Overview

All local data is stored in a single SQLite database.

**Path:**
- macOS: `~/Library/Application Support/com.operator.app/operator.db`
- Windows: `%APPDATA%\com.operator.app\operator.db`
- Linux: `~/.local/share/com.operator.app/operator.db`

**SQLite settings:**
```sql
PRAGMA journal_mode = WAL;      -- concurrent readers
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;    -- safe with WAL
PRAGMA cache_size = -64000;     -- 64 MB cache
```

---

## 2. Schema

### 2.1 repositories

```sql
CREATE TABLE repositories (
  id           TEXT PRIMARY KEY,               -- UUID
  name         TEXT NOT NULL,                  -- "mobiiworld-skills-lib"
  full_name    TEXT NOT NULL,                  -- "Justmalhar/mobiiworld-skills-lib"
  remote_url   TEXT NOT NULL,                  -- git remote origin URL
  local_path   TEXT NOT NULL UNIQUE,           -- absolute path to git root
  platform     TEXT NOT NULL DEFAULT 'github', -- 'github' | 'gitlab' | 'bitbucket' | 'azure' | 'local'
  default_branch TEXT NOT NULL DEFAULT 'main',
  icon_path    TEXT,                           -- local cache of repo icon
  operator_json TEXT,                          -- cached parsed operator.json content
  last_synced  DATETIME,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_repos_local_path ON repositories(local_path);
```

---

### 2.2 workspaces

```sql
CREATE TABLE workspaces (
  id              TEXT PRIMARY KEY,            -- UUID
  repository_id   TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  city_name       TEXT NOT NULL,               -- "tokyo", "berlin", "cairo"
  branch_name     TEXT NOT NULL,
  worktree_path   TEXT NOT NULL UNIQUE,        -- absolute path to worktree
  status          TEXT NOT NULL DEFAULT 'idle',
  -- 'idle' | 'running' | 'waiting' | 'needs_review' | 'error' | 'blocked' | 'archived'
  agent_backend   TEXT NOT NULL DEFAULT 'claude',  -- 'claude' | 'codex' | 'gemini'
  model           TEXT,                        -- e.g. 'claude-sonnet-4-6'
  reasoning_level TEXT DEFAULT 'medium',       -- 'fast' | 'medium' | 'high' | 'max'
  port_base       INTEGER,                     -- OPERATOR_PORT start
  pr_url          TEXT,                        -- GitHub/GitLab PR URL if created
  pr_number       INTEGER,
  total_cost_usd  REAL DEFAULT 0.0,            -- running session cost
  total_tokens    INTEGER DEFAULT 0,
  is_archived     BOOLEAN NOT NULL DEFAULT 0,
  archived_at     DATETIME,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ws_repo ON workspaces(repository_id);
CREATE INDEX idx_ws_status ON workspaces(status);
CREATE INDEX idx_ws_archived ON workspaces(is_archived);
```

---

### 2.3 messages

```sql
CREATE TABLE messages (
  id           TEXT PRIMARY KEY,            -- UUID
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  role         TEXT NOT NULL,               -- 'user' | 'assistant' | 'system'
  content      TEXT NOT NULL,              -- full message text (markdown)
  turn_id      TEXT,                       -- groups user+assistant for one turn
  model        TEXT,                       -- model used (assistant only)
  tool_calls   TEXT,                       -- JSON array of ToolCall objects
  file_changes TEXT,                       -- JSON array of FileChange objects
  duration_ms  INTEGER,                    -- agent thinking time (assistant only)
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd     REAL DEFAULT 0.0,
  is_checkpoint_turn BOOLEAN DEFAULT 0,    -- true = checkpoint taken before this turn
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_msgs_workspace ON messages(workspace_id);
CREATE INDEX idx_msgs_turn ON messages(turn_id);
CREATE INDEX idx_msgs_created ON messages(workspace_id, created_at);
```

---

### 2.4 checkpoints

```sql
CREATE TABLE checkpoints (
  id           TEXT PRIMARY KEY,            -- UUID
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  turn_id      TEXT NOT NULL,               -- references messages.turn_id
  git_sha      TEXT NOT NULL,               -- SHA of checkpoint commit
  git_ref      TEXT NOT NULL,               -- refs/operator/checkpoints/<ws_id>/<turn_id>
  description  TEXT,                        -- first line of user message
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_chk_workspace ON checkpoints(workspace_id);
CREATE INDEX idx_chk_turn ON checkpoints(turn_id);
```

---

### 2.5 todos

```sql
CREATE TABLE todos (
  id           TEXT PRIMARY KEY,            -- UUID
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  text         TEXT NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT 0,
  source       TEXT NOT NULL DEFAULT 'manual',  -- 'manual' | 'agent'
  position     INTEGER NOT NULL DEFAULT 0,  -- display order
  completed_at DATETIME,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_todos_workspace ON todos(workspace_id);
CREATE INDEX idx_todos_completed ON todos(workspace_id, completed);
```

---

### 2.6 skills

```sql
CREATE TABLE skills (
  id            TEXT PRIMARY KEY,           -- UUID or slug for built-ins
  name          TEXT NOT NULL UNIQUE,       -- slug: "code-review"
  display_name  TEXT NOT NULL,
  description   TEXT NOT NULL,
  category      TEXT NOT NULL,
  skill_md      TEXT NOT NULL,             -- raw SKILL.md content
  allowed_tools TEXT,                      -- comma-separated or JSON array
  context       TEXT NOT NULL DEFAULT 'default',  -- 'default' | 'fork'
  agent         TEXT,                      -- subagent type if fork
  auto_invoke   BOOLEAN NOT NULL DEFAULT 1,
  is_builtin    BOOLEAN NOT NULL DEFAULT 0,
  install_scope TEXT,                      -- 'global' | 'repo:<repo_id>' | null
  installed_path TEXT,                     -- file system path of installed SKILL.md
  is_enabled    BOOLEAN NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_skills_category ON skills(category);
CREATE INDEX idx_skills_builtin ON skills(is_builtin);
```

---

### 2.7 hooks

```sql
CREATE TABLE hooks (
  id            TEXT PRIMARY KEY,           -- UUID
  repository_id TEXT REFERENCES repositories(id) ON DELETE CASCADE,
  -- NULL = global hook
  event         TEXT NOT NULL,              -- HookEvent enum value
  matcher       TEXT,                       -- e.g. "Write(*.py)"
  handler_type  TEXT NOT NULL,              -- 'command' | 'prompt' | 'agent'
  handler       TEXT NOT NULL,             -- shell cmd, prompt text, or agent name
  is_enabled    BOOLEAN NOT NULL DEFAULT 1,
  is_preset     BOOLEAN NOT NULL DEFAULT 0,
  preset_id     TEXT,                       -- built-in preset identifier
  position      INTEGER NOT NULL DEFAULT 0, -- execution order within event
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hooks_repo ON hooks(repository_id);
CREATE INDEX idx_hooks_event ON hooks(event);
```

---

### 2.8 automations

```sql
CREATE TABLE automations (
  id            TEXT PRIMARY KEY,           -- UUID
  repository_id TEXT REFERENCES repositories(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  trigger_type  TEXT NOT NULL,              -- 'schedule' | 'git_hook' | 'pr_event' | 'manual'
  trigger_config TEXT,                      -- JSON: cron string, event name, etc.
  prompt        TEXT NOT NULL,              -- agent prompt template
  model         TEXT,
  is_enabled    BOOLEAN NOT NULL DEFAULT 1,
  last_run_at   DATETIME,
  last_run_status TEXT,                     -- 'success' | 'error' | 'running'
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2.9 memory_notes

```sql
CREATE TABLE memory_notes (
  id           TEXT PRIMARY KEY,            -- UUID
  repository_id TEXT REFERENCES repositories(id) ON DELETE CASCADE,
  -- NULL = global memory
  content      TEXT NOT NULL,
  source       TEXT NOT NULL DEFAULT 'agent',  -- 'agent' | 'manual'
  is_stale     BOOLEAN NOT NULL DEFAULT 0,     -- flagged by health check
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_memory_repo ON memory_notes(repository_id);
```

---

### 2.10 settings

```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL,       -- JSON-encoded value
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Example rows:
-- ('theme', '"dark"')
-- ('defaultBackend', '"claude"')
-- ('postHogEnabled', 'true')
-- ('sidebarCollapsed', 'false')
-- ('basePort', '3000')
```

---

### 2.11 git_operations_log

Audit trail for all git operations performed by Operator.

```sql
CREATE TABLE git_operations_log (
  id            TEXT PRIMARY KEY,           -- UUID
  workspace_id  TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
  operation     TEXT NOT NULL,              -- 'worktree_create' | 'commit' | 'push' | 'pr_create' | 'revert'
  details       TEXT,                       -- JSON with operation-specific data
  git_sha       TEXT,
  success       BOOLEAN NOT NULL,
  error_message TEXT,
  duration_ms   INTEGER,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gitlog_workspace ON git_operations_log(workspace_id);
CREATE INDEX idx_gitlog_created ON git_operations_log(created_at);
```

---

## 3. Migrations

Using `sqlx` migrations in `src-tauri/migrations/`:

```
migrations/
├── 0001_initial.sql          -- core tables
├── 0002_add_automations.sql  -- automations table
├── 0003_add_memory.sql       -- memory_notes table
└── 0004_add_git_log.sql      -- git_operations_log
```

Migrations run automatically on app startup via `sqlx::migrate!()`.

---

## 4. Data Retention Policy

| Table | Retention | Cleanup trigger |
|---|---|---|
| messages | Keep all (user-controlled delete) | Manual archive or workspace delete |
| checkpoints | 30 days default (configurable) | Background job, daily |
| git_operations_log | 90 days | Background job, weekly |
| memory_notes | Until manually deleted | User action |
| automations | Until manually deleted | User action |

Background cleanup runs at app startup and every 24h if app stays open.
