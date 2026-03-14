-- Operator DB v1 — automations table

CREATE TABLE IF NOT EXISTS automations (
    id              TEXT PRIMARY KEY,
    repository_id   TEXT REFERENCES repositories(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    trigger_type    TEXT NOT NULL,
    trigger_config  TEXT,
    prompt          TEXT NOT NULL,
    model           TEXT,
    is_enabled      INTEGER NOT NULL DEFAULT 1,
    last_run_at     TEXT,
    last_run_status TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
