-- Operator DB v1 — core tables

CREATE TABLE IF NOT EXISTS repositories (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL,
    full_name      TEXT NOT NULL,
    remote_url     TEXT NOT NULL,
    local_path     TEXT NOT NULL UNIQUE,
    platform       TEXT NOT NULL DEFAULT 'github',
    default_branch TEXT NOT NULL DEFAULT 'main',
    icon_path      TEXT,
    operator_json  TEXT,
    last_synced    TEXT,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_repos_local_path ON repositories(local_path);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS workspaces (
    id              TEXT PRIMARY KEY,
    repository_id   TEXT NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
    city_name       TEXT NOT NULL,
    branch_name     TEXT NOT NULL,
    worktree_path   TEXT NOT NULL UNIQUE,
    status          TEXT NOT NULL DEFAULT 'idle',
    agent_backend   TEXT NOT NULL DEFAULT 'claude',
    model           TEXT,
    reasoning_level TEXT DEFAULT 'medium',
    port_base       INTEGER,
    pr_url          TEXT,
    pr_number       INTEGER,
    total_cost_usd  REAL    NOT NULL DEFAULT 0.0,
    total_tokens    INTEGER NOT NULL DEFAULT 0,
    is_archived     INTEGER NOT NULL DEFAULT 0,
    archived_at     TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_ws_repo     ON workspaces(repository_id);
CREATE INDEX IF NOT EXISTS idx_ws_status   ON workspaces(status);
CREATE INDEX IF NOT EXISTS idx_ws_archived ON workspaces(is_archived);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS messages (
    id                 TEXT PRIMARY KEY,
    workspace_id       TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    role               TEXT NOT NULL,
    content            TEXT NOT NULL,
    turn_id            TEXT,
    model              TEXT,
    tool_calls         TEXT,
    file_changes       TEXT,
    duration_ms        INTEGER,
    input_tokens       INTEGER,
    output_tokens      INTEGER,
    cost_usd           REAL NOT NULL DEFAULT 0.0,
    is_checkpoint_turn INTEGER NOT NULL DEFAULT 0,
    created_at         TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_msgs_workspace ON messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_msgs_turn      ON messages(turn_id);
CREATE INDEX IF NOT EXISTS idx_msgs_created   ON messages(workspace_id, created_at);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS checkpoints (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    turn_id      TEXT NOT NULL,
    git_sha      TEXT NOT NULL,
    git_ref      TEXT NOT NULL,
    description  TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_chk_workspace ON checkpoints(workspace_id);
CREATE INDEX IF NOT EXISTS idx_chk_turn      ON checkpoints(turn_id);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS todos (
    id           TEXT PRIMARY KEY,
    workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    text         TEXT NOT NULL,
    completed    INTEGER NOT NULL DEFAULT 0,
    source       TEXT    NOT NULL DEFAULT 'manual',
    position     INTEGER NOT NULL DEFAULT 0,
    completed_at TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_todos_workspace  ON todos(workspace_id);
CREATE INDEX IF NOT EXISTS idx_todos_completed  ON todos(workspace_id, completed);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS skills (
    id             TEXT PRIMARY KEY,
    name           TEXT NOT NULL UNIQUE,
    display_name   TEXT NOT NULL,
    description    TEXT NOT NULL,
    category       TEXT NOT NULL,
    skill_md       TEXT NOT NULL,
    allowed_tools  TEXT,
    context        TEXT NOT NULL DEFAULT 'default',
    agent          TEXT,
    auto_invoke    INTEGER NOT NULL DEFAULT 1,
    is_builtin     INTEGER NOT NULL DEFAULT 0,
    install_scope  TEXT,
    installed_path TEXT,
    is_enabled     INTEGER NOT NULL DEFAULT 1,
    created_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_builtin  ON skills(is_builtin);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS hooks (
    id            TEXT PRIMARY KEY,
    repository_id TEXT REFERENCES repositories(id) ON DELETE CASCADE,
    event         TEXT    NOT NULL,
    matcher       TEXT,
    handler_type  TEXT    NOT NULL,
    handler       TEXT    NOT NULL,
    is_enabled    INTEGER NOT NULL DEFAULT 1,
    is_preset     INTEGER NOT NULL DEFAULT 0,
    preset_id     TEXT,
    position      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_hooks_repo  ON hooks(repository_id);
CREATE INDEX IF NOT EXISTS idx_hooks_event ON hooks(event);

-- -------------------------------------------------------

CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
