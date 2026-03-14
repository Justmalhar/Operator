-- Operator DB v1 — memory_notes table

CREATE TABLE IF NOT EXISTS memory_notes (
    id            TEXT PRIMARY KEY,
    repository_id TEXT REFERENCES repositories(id) ON DELETE CASCADE,
    content       TEXT    NOT NULL,
    source        TEXT    NOT NULL DEFAULT 'agent',
    is_stale      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_memory_repo ON memory_notes(repository_id);
