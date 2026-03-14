# Operator — Documentation Index

*Version 1.0 · March 2026 · Mobiiworld FZ LLC*

> Cross-platform AI agent orchestration desktop app. Built with Tauri + React + Rust.

---

## Document Map

| # | Document | Description |
|---|---|---|
| 01 | [System Design](01-system-design.md) | Architecture, tech stack, process model, data flow, security, performance targets |
| 02 | [UI Layout & Screens](02-ui-layout-screens.md) | All screens with ASCII wireframes: empty state, workspace, diff, skills, settings, hooks, agent teams |
| 03 | [Component Design](03-component-design.md) | React component tree, props interfaces, state management, theme system |
| 04 | [Database Schema](04-database-schema.md) | Full SQLite schema: repositories, workspaces, messages, checkpoints, todos, skills, hooks |
| 05 | [API Design](05-api-design.md) | All Tauri IPC commands (TypeScript + Rust), Tauri events, error types |
| 06 | [Git Operations](06-git-operations.md) | Worktree management, checkpoint system, diff generation, PR creation, file indexing |
| 07 | [Logging](07-logging.md) | Rust tracing setup, React logger, analytics events, crash reporting, audit trail |
| 08 | [React Packages](08-react-packages.md) | Full package.json, xterm.js setup, CodeMirror diff, react-arborist, cmdk, Zustand |
| 09 | [Conductor Parity](09-conductor-parity.md) | Feature-by-feature parity matrix vs Conductor, env var compatibility, migration plan |
| 10 | [Settings](10-settings.md) | All settings panels, app settings schema, per-repo settings, env vars panel |
| 11 | [Rendering Performance](11-rendering-performance.md) | WebGL terminal, diff virtualization, message list virtualization, IPC optimization |

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Desktop framework | **Tauri 2.x** | ~35 MB RAM vs Electron's ~250 MB; critical for 10 parallel workspaces |
| UI framework | **React 19 + TypeScript** | Team familiarity; rich ecosystem for terminal/diff/tree components |
| Terminal | **xterm.js + WebGL addon** | Only production-ready embedded terminal; WebGL = 60fps |
| Diff viewer | **CodeMirror 6 MergeView** | Virtualized, syntax-highlighted, handles 10k+ line files |
| File tree | **react-arborist** | Built-in virtualization; 10k files renders in <100ms |
| Command palette | **cmdk** | Accessible, keyboard-first, used by Vercel, Linear, etc. |
| State management | **Zustand + Immer** | Zero boilerplate; Tauri IPC friendly |
| Git operations | **git2 (libgit2)** | No PATH dependency on git CLI; faster; used in production tools |
| Database | **SQLite via sqlx** | Local-first; zero infra; WAL mode for concurrent workspace writes |
| Analytics | **PostHog** | Self-hostable; GDPR-friendly; no code/content collection |

---

## Architecture at a Glance

```
┌─────────────────────────────────────────┐
│          Tauri App (Desktop)            │
│  ┌──────────────────┐  ┌─────────────┐  │
│  │   React + Vite   │  │  Rust Core  │  │
│  │   (WebView)      │  │ (src-tauri) │  │
│  │                  │  │             │  │
│  │  xterm.js        │◄►│  libgit2    │  │
│  │  CodeMirror      │  │  portable-  │  │
│  │  react-arborist  │  │  pty        │  │
│  │  cmdk            │  │  notify     │  │
│  │  Zustand         │  │  sqlx       │  │
│  └──────────────────┘  └─────────────┘  │
└─────────────────────────────────────────┘
      │                        │
      ▼                        ▼
 System WebView           OS Filesystem
 (WKWebView /            ~/operator/
  WebView2 /             workspaces/
  WebKitGTK)             ~/.operator/
```

---

## Week 1 Sprint Scope

Documents above cover the full v1.0 spec. Week 1 alpha targets:

- ✅ Tauri app shell + React scaffold
- ✅ Git worktree engine (libgit2)
- ✅ Claude Code PTY embed (xterm.js)
- ✅ Workspace sidebar + city names
- ✅ Setup / Run scripts + operator.json
- ✅ Diff viewer (CodeMirror MergeView)
- ✅ Checkpoint system (Git refs)
- ✅ @ file mentions (fuse.js)
- ✅ Image/file attachments (drag-drop)
- ✅ Todos panel + merge gate
- ✅ Slash command palette (⌘K, 8 built-in commands)
- ✅ PR creation (gh CLI)

---

## Conductor Compatibility

Operator is a superset of Conductor. Every Conductor feature works in Operator:
- `conductor.json` scripts fully supported (+ extended `operator.json` schema)
- `CONDUCTOR_*` env vars injected alongside `OPERATOR_*` (same values)
- `.claude/commands/` slash commands imported as skills
- One-click migration from Conductor in Settings → Advanced
- All git worktree behavior is identical
