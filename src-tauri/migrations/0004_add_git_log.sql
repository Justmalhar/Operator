-- Operator DB v1 — git_operations_log table

CREATE TABLE IF NOT EXISTS git_operations_log (
    id            TEXT PRIMARY KEY,
    workspace_id  TEXT REFERENCES workspaces(id) ON DELETE SET NULL,
    operation     TEXT    NOT NULL,
    details       TEXT,
    git_sha       TEXT,
    success       INTEGER NOT NULL,
    error_message TEXT,
    duration_ms   INTEGER,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_gitlog_workspace ON git_operations_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_gitlog_created   ON git_operations_log(created_at);
