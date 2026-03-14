# Operator — System Design

*Version 1.0 · March 2026 ·

---

## 1. Overview

Operator is a cross-platform desktop application (macOS, Windows, Linux) for orchestrating fleets of AI coding agents across multiple isolated Git worktrees simultaneously. It wraps Claude Code, OpenAI Codex, and future agent backends behind a unified, visual interface.

**Core value proposition:** A developer assigns tasks to N parallel agents. Each agent works in an isolated branch. The developer reviews diffs, approves merges, never touches a terminal.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                   Tauri Shell (Rust)                │
│  ┌──────────────────┐   ┌───────────────────────┐   │
│  │  React Frontend   │   │   Rust Backend Core   │   │
│  │  (WebView / WK)   │◄─►│   (src-tauri/src/)    │   │
│  │                   │   │                       │   │
│  │  - Workspace UI   │   │  - Git Engine         │   │
│  │  - Chat Composer  │   │  - Agent Process Mgr  │   │
│  │  - Diff Viewer    │   │  - PTY Manager        │   │
│  │  - File Tree      │   │  - Checkpoint Engine  │   │
│  │  - Skill Panel    │   │  - File Watcher       │   │
│  │  - Hooks Config   │   │  - Port Allocator     │   │
│  │  - Settings       │   │  - operator.json      │   │
│  └──────────────────┘   └───────────────────────┘   │
└─────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
   System WebView            OS / Filesystem
   (WKWebView/               /Users/.../
    WebView2/                ~/operator/workspaces/
    WebKitGTK)               ~/.operator/
```

---

## 3. Technology Stack

### 3.1 Desktop Shell

| Layer | Technology | Rationale |
|---|---|---|
| App framework | **Tauri 2.x** | Native webview, Rust core, 5–10 MB binary, ~35 MB RAM idle |
| Frontend | **React 19 + TypeScript** | Component model, strong ecosystem, team familiarity |
| Styling | **Tailwind CSS v4** | Utility-first, consistent design tokens |
| State management | **Zustand** | Lightweight, no boilerplate, Tauri IPC friendly |
| Build tool | **Vite 6** | Fast HMR, TypeScript native |
| Rust edition | **2021** | Modern async, stable toolchain |

### 3.2 Key Rust Crates

| Crate | Purpose |
|---|---|
| `git2` (libgit2 bindings) | Worktree create/delete/list, branch ops, checkpoint refs |
| `portable-pty` | PTY spawning for Claude Code / Codex subprocesses |
| `notify` | File watching for spotlight sync and file change detection |
| `serde` + `serde_json` | JSON serialization for IPC, operator.json parsing |
| `tokio` | Async runtime for concurrent agent operations |
| `tauri` | Desktop shell framework, IPC, plugin system |
| `which` | Resolve `claude`, `codex`, `gh`, `glab` binary paths |
| `keyring` | Secure credential storage (OS keychain) |
| `sqlx` + SQLite | Local storage: workspaces, chat history, checkpoints, todos |
| `directories` | Cross-platform path resolution (~/.operator, ~/operator/) |
| `regex` | Pattern matching in hooks engine |
| `uuid` | Workspace and checkpoint ID generation |
| `chrono` | Timestamps for checkpoints, memory freshness |

### 3.3 Key React Packages (see `08-react-packages.md` for full spec)

| Package | Purpose |
|---|---|
| `@xterm/xterm` + `@xterm/addon-fit` | Embedded PTY terminal |
| `@codemirror/view` + language packs | Diff viewer, code editor |
| `react-arborist` | File tree with virtualization |
| `fuse.js` | Fuzzy search for @ file mentions, skill search |
| `@tanstack/react-virtual` | Virtualized lists (threads, workspaces) |
| `framer-motion` | Transitions, workspace card animations |
| `cmdk` | Command palette (⌘K slash commands) |
| `react-resizable-panels` | Resizable layout panels |
| `zustand` | Global state management |
| `immer` | Immutable state updates |

---

## 4. Process Architecture

### 4.1 Workspace Process Model

Each workspace has exactly one agent process:

```
Operator App (Tauri)
├── Workspace "tokyo" (worktree: ~/operator/workspaces/myrepo/tokyo/)
│   └── Claude Code process (PTY) ──► xterm.js panel in webview
├── Workspace "berlin" (worktree: ~/operator/workspaces/myrepo/berlin/)
│   └── Claude Code process (PTY) ──► xterm.js panel in webview
└── Workspace "cairo" (worktree: ~/operator/workspaces/myrepo/cairo/)
    └── Codex process (PTY) ──► xterm.js panel in webview
```

Key invariants:

- One PTY process per workspace, max
- Processes use `portable-pty` Rust crate — full PTY, not just stdio pipe
- Each process runs inside its worktree directory as cwd
- Environment vars injected: `OPERATOR_*`, `CONDUCTOR_*` (compat), user env + direnv

### 4.2 Checkpoint Process

Before each agent turn:

1. Rust hook fires (registered via Claude Code's hook system)
2. `git2` commits all working tree state to `refs/operator/checkpoints/<workspace_id>/<turn_id>`
3. Turn ID + git SHA stored in SQLite
4. UI shows revert button for each turn in chat

### 4.3 Port Allocation

Each workspace receives 10 consecutive ports:

```rust
OPERATOR_PORT = BASE_PORT + (workspace_index * 10)
// e.g. workspace 0 → 3000–3009, workspace 1 → 3010–3019
```

Base port configurable in Settings (default: 3000).

---

## 5. Data Flow

### 5.1 IPC Command Pattern (Tauri)

All Rust↔React communication uses Tauri's typed command system:

```
React (TypeScript)          Tauri IPC              Rust Backend
─────────────────          ─────────              ────────────
invoke("create_workspace",  ──────────────────►   #[tauri::command]
  { repoId, branchName })                          fn create_workspace(...)

                            ◄──────────────────   Ok(WorkspaceInfo { id, path, cityName })
```

Events (Rust → React, streamed):

```
emit("agent_output", { workspaceId, chunk })     // PTY output streaming
emit("checkpoint_created", { workspaceId, turnId })
emit("workspace_status_changed", { id, status })
emit("git_diff_updated", { workspaceId })
```

### 5.2 Agent Output Streaming

```
Claude Code PTY
    │
    ▼ bytes (via portable-pty read loop)
Rust: tauri::emit("agent_output", chunk)
    │
    ▼ Tauri IPC (serialized)
React: xterm.js write(chunk)
    │
    ▼ rendered in WebView
```

---

## 6. Storage Architecture

### 6.1 Local SQLite Database

Path: `~/Library/Application Support/com.operator.app/operator.db` (macOS)

Tables: see `04-database-schema.md`

### 6.2 File System Layout

```
~/operator/
└── workspaces/
    └── <repo-slug>/
        ├── <city-name>/          ← git worktree
        │   ├── .git              ← worktree ref (not full .git)
        │   ├── .env              ← symlinked from repo root
        │   └── <project files>
        └── <city-name-2>/

~/.operator/
├── OPERATOR.md                   ← global instruction file
├── memory/                       ← auto-memory notes
│   └── <project>/
├── skills/                       ← global skills
│   └── <skill-name>/
│       └── SKILL.md
├── commands/                     ← global slash commands
└── config.toml                   ← global config

<repo-root>/
├── OPERATOR.md                   ← project instruction file (syncs to CLAUDE.md + AGENTS.md)
├── CLAUDE.md                     ← Claude Code compat
├── AGENTS.md                     ← Codex compat
├── operator.json                 ← team config (committed to git)
└── .operator/
    ├── skills/
    ├── commands/
    ├── agents/
    └── hooks/
```

---

## 7. Security Model

### 7.1 Credential Storage

- API keys stored in OS keychain via `keyring` crate (macOS Keychain, Windows Credential Manager, Linux Secret Service)
- Never stored in SQLite, operator.json, or any file on disk
- IPC commands never transmit raw credentials to frontend

### 7.2 Tauri Capability System

Operator exposes only named commands to the webview. No direct filesystem, network, or OS access from JS. All sensitive operations go through Rust command handlers with explicit capability declarations in `tauri.conf.json`.

### 7.3 Agent Sandboxing

Agents run with user-level permissions (same as the logged-in user). No additional sandboxing in v1.0. Enterprise plan adds optional macOS seatbelt (sandbox-exec) or Docker-based workspace isolation.

### 7.4 Data Residency

- Source code: local filesystem only — never uploaded to Operator servers
- Chat history: local SQLite only
- Model API traffic: direct to provider (Anthropic, OpenAI) — never routed through Operator servers
- Analytics: anonymized events to PostHog (disable via `enterpriseDataPrivacy: true` in operator.json)

---

## 8. Cross-Platform Strategy

| Platform | WebView | PTY | Keychain | Worktree Path |
|---|---|---|---|---|
| macOS | WKWebView | macOS native PTY | Keychain Services | `~/operator/workspaces/` |
| Windows | WebView2 (Edge) | ConPTY | Windows Credential Manager | `%USERPROFILE%\operator\workspaces\` |
| Linux | WebKitGTK | POSIX PTY | libsecret | `~/operator/workspaces/` |

**Windows-specific:** ConPTY for terminal emulation; WebView2 must be installed (bundled in installer). Windows experimental in v0.1, stable in v1.0.

---

## 9. Performance Targets

| Metric | Target | Method |
|---|---|---|
| Cold start | < 400ms | Tauri native webview, lazy-loaded React panels |
| Idle RAM (1 workspace) | < 50 MB | Single webview, Rust backend |
| RAM per additional workspace | < 15 MB | Worktrees share object store; only PTY process adds memory |
| PTY output render latency | < 16ms (60fps) | xterm.js WebGL renderer |
| Diff render (10k lines) | < 200ms | CodeMirror virtualization |
| Slash command palette open | < 50ms | Pre-indexed, in-memory fuse.js |
| File tree render (10k files) | < 100ms | react-arborist virtualization |

---

## 10. Observability & Logging

See `10-logging.md` for full specification.

- Structured JSON logs via `tracing` crate (Rust) + browser `console` (React)
- Log levels: ERROR, WARN, INFO, DEBUG, TRACE
- Log files: `~/Library/Logs/Operator/operator.log` (macOS), rotated daily, max 7 days
- PostHog analytics: feature usage events only (no code, no chat content)
- Crash reporter: Sentry (opt-in, disabled for enterprise privacy mode)

---

## 11. Update Strategy

- Auto-update via Tauri updater plugin
- Update check on launch (non-blocking)
- Delta updates where possible
- Release channels: stable, beta, nightly
- Bundled Claude Code + Codex binaries versioned separately — updated via Operator release, not system package manager

---

## 12. Open Questions

1. Should Claude Code / Codex binaries be bundled or resolved from PATH? Bundled = compatibility guarantee but maintenance overhead. PATH = user controls version.
2. ConPTY vs WSL for Windows terminal — ConPTY is native but less capable. WSL is powerful but adds a dependency.
3. SQLite WAL mode for concurrent workspace writes — confirm no corruption risk with N simultaneous agent writes.
