# Operator — Directory Structure

*Version 1.0 · March 2026 · Mobiiworld FZ LLC*

---

## Repository Layout

```
operator/
├── src/                          ← React frontend (TypeScript)
│   ├── main.tsx                  ← Vite entry point
│   ├── App.tsx                   ← Root component, theme provider, global overlays
│   ├── components/
│   │   ├── sidebar/
│   │   │   ├── WorkspaceList.tsx
│   │   │   ├── WorkspaceItem.tsx
│   │   │   ├── RepoGroup.tsx
│   │   │   └── SidebarNav.tsx
│   │   ├── workspace/
│   │   │   ├── WorkspaceTabs.tsx
│   │   │   ├── WorkspacePane.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── WorkspaceErrorBoundary.tsx
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── AgentMessage.tsx
│   │   │   ├── UserMessage.tsx
│   │   │   ├── ToolCallExpander.tsx
│   │   │   └── FileChangeBadges.tsx
│   │   ├── composer/
│   │   │   ├── Composer.tsx
│   │   │   ├── ComposerTextarea.tsx
│   │   │   ├── AttachmentRow.tsx
│   │   │   ├── ModelPicker.tsx
│   │   │   ├── ReasoningPicker.tsx
│   │   │   ├── StatusBar.tsx
│   │   │   └── FileMentionOverlay.tsx
│   │   ├── panels/
│   │   │   ├── RightPanel.tsx
│   │   │   ├── BottomPanel.tsx
│   │   │   ├── FileTree.tsx
│   │   │   ├── ChangesTab.tsx
│   │   │   ├── ChecksTab.tsx
│   │   │   ├── SetupTab.tsx
│   │   │   ├── RunTab.tsx
│   │   │   └── TerminalTab.tsx
│   │   ├── diff/
│   │   │   └── DiffViewer.tsx
│   │   ├── skills/
│   │   │   └── SkillPanel.tsx
│   │   ├── hooks/
│   │   │   └── HooksConfigurator.tsx
│   │   ├── checkpoints/
│   │   │   └── CheckpointList.tsx
│   │   ├── todos/
│   │   │   └── TodosPanel.tsx
│   │   ├── settings/
│   │   │   └── SettingsPanel.tsx
│   │   ├── shared/
│   │   │   ├── TitleBar.tsx
│   │   │   ├── CommandPalette.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   └── GlobalErrorBoundary.tsx
│   │   └── layout/
│   │       └── SidebarLayout.tsx
│   ├── store/                    ← Zustand slices
│   │   ├── appStore.ts           ← theme, activeWorkspaceId, sidebarCollapsed
│   │   ├── workspaceStore.ts     ← workspaces[], repos[], activeRepo
│   │   ├── chatStore.ts          ← messages per workspaceId, streaming state
│   │   ├── skillStore.ts         ← installed + available skills
│   │   ├── settingsStore.ts      ← model configs, backend auth, privacy
│   │   ├── checkpointStore.ts    ← checkpoints per workspaceId
│   │   ├── todoStore.ts          ← todos per workspaceId
│   │   └── hookStore.ts          ← hook configs per repoId
│   ├── hooks/                    ← React custom hooks
│   │   ├── useTauriEvent.ts      ← typed wrapper for Tauri event listener
│   │   ├── useWorkspace.ts
│   │   ├── useChat.ts
│   │   └── useFileIndex.ts       ← fuse.js workspace file index
│   ├── lib/                      ← Utilities and Tauri IPC wrappers
│   │   ├── tauri.ts              ← invoke() typed wrappers for all IPC commands
│   │   ├── logger.ts             ← React-side structured logger
│   │   ├── diff.ts               ← Diff parsing helpers
│   │   └── cityNames.ts          ← City name list for workspace naming
│   ├── types/                    ← Shared TypeScript interfaces
│   │   ├── workspace.ts
│   │   ├── message.ts
│   │   ├── skill.ts
│   │   ├── hook.ts
│   │   ├── checkpoint.ts
│   │   ├── todo.ts
│   │   └── model.ts
│   └── styles/
│       ├── globals.css           ← CSS custom properties (theme tokens)
│       └── tailwind.css          ← Tailwind entry
│
├── src-tauri/                    ← Rust backend (Tauri core)
│   ├── Cargo.toml
│   ├── tauri.conf.json           ← Tauri capabilities, window config, updater
│   ├── build.rs
│   └── src/
│       ├── main.rs               ← Tauri builder, plugin registration
│       ├── lib.rs                ← Re-exports, app state setup
│       ├── commands/             ← #[tauri::command] handlers (IPC surface)
│       │   ├── workspace.rs      ← create/delete/list workspaces
│       │   ├── git.rs            ← diff, branch ops, PR creation
│       │   ├── agent.rs          ← start/stop agent process, send input
│       │   ├── terminal.rs       ← PTY create/resize/write
│       │   ├── checkpoint.rs     ← create/list/revert checkpoints
│       │   ├── skill.rs          ← install/uninstall/list skills
│       │   ├── hook.rs           ← save/load hook configs, test hook
│       │   ├── settings.rs       ← read/write app + repo settings
│       │   ├── shell.rs          ← run_shell_command (! injection)
│       │   └── file.rs           ← file index, read file content
│       ├── git/                  ← libgit2 wrappers
│       │   ├── worktree.rs       ← worktree create/delete/list
│       │   ├── checkpoint.rs     ← git ref-based checkpoint logic
│       │   ├── diff.rs           ← unified diff generation
│       │   └── index.rs          ← file index for @ mentions
│       ├── pty/                  ← portable-pty wrappers
│       │   ├── manager.rs        ← PTY lifecycle, per-workspace map
│       │   └── reader.rs         ← async read loop → tauri::emit("agent_output")
│       ├── db/                   ← sqlx + SQLite
│       │   ├── schema.rs         ← CREATE TABLE statements, migrations
│       │   ├── repository.rs     ← repos table CRUD
│       │   ├── workspace.rs      ← workspaces table CRUD
│       │   ├── message.rs        ← messages table CRUD
│       │   ├── checkpoint.rs     ← checkpoints table CRUD
│       │   ├── todo.rs           ← todos table CRUD
│       │   ├── skill.rs          ← skills table CRUD
│       │   └── hook.rs           ← hooks table CRUD
│       ├── config/
│       │   ├── operator_json.rs  ← operator.json parsing + defaults
│       │   └── app_settings.rs   ← ~/.operator/config.toml R/W
│       ├── ports.rs              ← port allocation (BASE + workspace_index * 10)
│       ├── watcher.rs            ← notify file watcher, git status sync
│       └── error.rs              ← unified AppError enum, tauri::InvokeError impl
│
├── docs/                         ← Project documentation
│   ├── 00-index.md
│   ├── 01-system-design.md
│   ├── 02-ui-layout-screens.md
│   ├── 03-component-design.md
│   ├── 04-database-schema.md
│   ├── 05-api-design.md
│   ├── 06-git-operations.md
│   ├── 07-logging.md
│   ├── 08-react-packages.md
│   ├── 09-conductor-parity.md
│   ├── 10-settings.md
│   ├── 11-rendering-performance.md
│   └── 12-dir-structure.md       ← this file
│
├── public/                       ← Vite static assets
│   └── icons/
│
├── index.html                    ← Vite HTML entry
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── package.json                  ← bun-managed dependencies
├── bun.lock
├── operator.json                 ← Team config (committed to git)
├── OPERATOR.md                   ← Project instruction file (syncs to CLAUDE.md + AGENTS.md)
├── CLAUDE.md                     ← Claude Code compatibility
├── AGENTS.md                     ← Codex compatibility
├── README.md
├── LICENSE
└── .gitignore
```

---

## Runtime Filesystem Layout

```
~/operator/
└── workspaces/
    └── <repo-slug>/
        ├── <city-name>/          ← git worktree (e.g. "tokyo", "berlin")
        │   ├── .git              ← worktree ref (not full .git dir)
        │   ├── .env              ← symlinked from repo root
        │   └── <project files>
        └── <city-name-2>/

~/.operator/
├── OPERATOR.md                   ← global instruction file
├── config.toml                   ← global config
├── ui-state.json                 ← Zustand persisted UI state
├── memory/
│   └── <project-slug>/           ← auto-memory notes per project
├── skills/
│   └── <skill-name>/
│       └── SKILL.md
└── commands/                     ← global slash commands

<repo-root>/
├── OPERATOR.md
├── CLAUDE.md
├── AGENTS.md
├── operator.json
└── .operator/
    ├── skills/
    ├── commands/
    ├── agents/
    └── hooks/
```

---

## Database Location

| Platform | Path |
|----------|------|
| macOS    | `~/Library/Application Support/com.operator.app/operator.db` |
| Windows  | `%APPDATA%\com.operator.app\operator.db` |
| Linux    | `~/.local/share/com.operator.app/operator.db` |

---

## Log File Location

| Platform | Path |
|----------|------|
| macOS    | `~/Library/Logs/Operator/operator.log` |
| Windows  | `%APPDATA%\Operator\logs\operator.log` |
| Linux    | `~/.local/share/Operator/logs/operator.log` |

Log files are rotated daily and retained for 7 days.
