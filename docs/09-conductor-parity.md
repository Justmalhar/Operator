# Operator — Conductor Feature Parity

*Version 1.0 · March 2026 · Source: Full Conductor docs review*

Every feature Conductor ships is catalogued here with Operator's implementation status, enhancement plan, and any deliberate divergence.

---

## 1. Parity Matrix

| Conductor Feature | Conductor Implementation | Operator Status | Operator Enhancement |
|---|---|---|---|
| Git worktree isolation | libgit2 + worktrees in `~/conductor/workspaces/` | ✅ Full parity | Same path pattern (`~/operator/workspaces/`) + Conductor compat env vars |
| Parallel agents (⌘N) | Multiple Claude Code PTYs | ✅ Full parity | Adds Codex + Gemini backends |
| City name workspaces | Random city list | ✅ Full parity | Larger city list (500+), emoji-free |
| Workspace status indicators | ●/○ in sidebar | ✅ Full parity | + Cost badge, todo count badge |
| Setup script | Runs on workspace create | ✅ Full parity | + Template library, GUI editor |
| Run script + $CONDUCTOR_PORT | Per-workspace port allocation | ✅ Full parity | Same env vars + OPERATOR_* aliases |
| Archive script | Runs on archive | ✅ Full parity | |
| conductor.json / operator.json | Committed team config | ✅ Full parity | Extended schema (skills, hooks, context) |
| Diff viewer (⌘D) | Custom diff UI | ✅ Full parity | CodeMirror MergeView — adds inline comments, viewed tracking |
| File tree (Changes tab) | Right panel | ✅ Full parity | + All Files tab with react-arborist |
| Todos panel + merge gate | Notes tab | ✅ Full parity | + @todos in composer, agent can tick todos |
| Checkpoints (per-turn revert) | Local Git refs | ✅ Full parity | + checkpoint list UI, confirm modal |
| Terminal (Setup/Run/Terminal tabs) | xterm.js | ✅ Full parity | + multiple sessions per workspace, ⌘F search |
| MCP integration | claude mcp add CLI | ✅ Full parity | + in-app MCP marketplace UI |
| Slash commands (.claude/commands/) | Markdown files | ✅ Extended | Full GUI palette (⌘K), 40 built-in skills |
| Spotlight testing | Experimental file sync | ✅ Full parity | Same watchexec approach, graduates to stable in v1.1 |
| direnv support | Loads per-workspace .envrc | ✅ Full parity | |
| GitHub PR creation | gh CLI | ✅ Full parity | + GitLab MR (glab CLI), Bitbucket, Azure DevOps |
| Linear issue workspace creation | ⌘⇧N → Issues tab | ✅ Full parity | + Jira issues |
| Branch workspace creation | ⌘⇧N → Branches tab | ✅ Full parity | |
| PR workspace creation | ⌘⇧N → PRs tab | ✅ Full parity | |
| Git worktree → branch 1:1 | One branch per workspace | ✅ Full parity | |
| /add-dir multi-repo linking | Slash command | ✅ Full parity | |
| Monorepo sparse checkout | git sparse checkout | ✅ Full parity | + GUI directory picker |
| Workspace rename | Sidebar rename | ✅ Full parity | |
| Open in IDE (⌘O) | Cursor/VSCode | ✅ Full parity | + Xcode, custom IDE |
| Cursor window titling | window.title setting | ✅ Docs parity | |
| Cursor → Operator migration | Migration guide + shell script | ✅ Full parity | + one-click import in Settings |
| Nonconcurrent run script mode | Advanced settings | ✅ Full parity | |
| concurrently multi-process | User responsibility | ✅ Docs parity | + auto-detect & warn on & backgrounding |
| Multiple repos per instance | Sidebar | ✅ Full parity | |
| Claude Opus 4.6 1M context | Settings → Models | ✅ Full parity | |
| Codex (GPT-5.4) support | Model picker | ✅ Full parity | |
| OpenRouter / Bedrock / Vertex | Settings → Env | ✅ Full parity | + GUI provider panel instead of raw env vars |
| Cost indicator | Top bar per workspace | ✅ Full parity | + per-turn cost in chat, team dashboard (v1.1) |
| GitHub Actions / CI status | Checks tab | ✅ Full parity | |
| Multiline diff comments | Drag to select | ✅ Full parity | |
| Auto-archive on PR merge | Setting | ✅ Full parity | |
| Plan mode | Shift+Tab cycle | ✅ Full parity | |
| Background agent (Ctrl+B) | CLI behavior | ✅ Full parity | + visual bg indicator in workspace sidebar |
| Session resume | Claude Code --resume | ✅ Full parity | |
| Session fork | ⌘O cmd | ✅ Full parity | /fork command |
| CLAUDE.md instruction file | Raw file edit | ✅ Extended | + visual editor, templates, conflict detection |
| Passport (visited cities) | ⌘K → Passport | ✅ Full parity | |
| No bundled Chromium | WKWebView | ✅ Core to Tauri | |
| Self-update | Tauri updater | ✅ Full parity | |
| Enterprise data privacy toggle | conductor.json | ✅ Full parity | |

---

## 2. Conductor Features Operator Intentionally Improves

### 2.1 Workspace Status Indicators

**Conductor:** Basic ●/○ only  
**Operator:** Full status matrix with cost badge, todo count, review indicator

```
● (green pulse)    = agent running
● (amber pulse)    = agent waiting for input
✓ (blue)          = done, needs review
● (red)           = error
○ (grey)          = idle
⚠ (amber static)  = blocked by todos
[$0.34]            = session cost (always visible)
[2 todos]          = todo count badge
```

### 2.2 Diff Viewer

**Conductor:** Custom diff implementation with basic GitHub-style comments  
**Operator:** CodeMirror 6 `MergeView` with:
- Syntax highlighting for all major languages
- Click-drag multiline comment selection  
- "Viewed" checkbox per file (tracks review progress)
- `[` / `]` keyboard nav between files
- `n` / `p` nav between hunks
- Collapse unchanged lines (3-line context)

### 2.3 Terminal

**Conductor:** Single terminal per workspace, basic xterm.js  
**Operator:** 
- Multiple terminal sessions per workspace (+ button in tab bar)
- ⌘F search overlay (SearchAddon)
- WebGL renderer (60fps guaranteed)
- Session persistence across workspace switches

### 2.4 Slash Commands → Skill Library

**Conductor:** Raw `.claude/commands/` markdown files only, no GUI  
**Operator:**
- ⌘K palette with 3-pane layout (categories | commands | SKILL.md preview)
- 40 built-in skills out of the box
- Skills follow Agent Skills Open Standard (work in Claude Code + Codex)
- Auto-invocation (skill activates when task context matches)
- Install to global or repo scope with one click

### 2.5 operator.json vs conductor.json

**Conductor:** `scripts.setup`, `scripts.run`, `scripts.archive`, `runScriptMode`, `enterpriseDataPrivacy`  
**Operator:** Full conductor.json schema + extensions:
- `agents.defaultBackend`, `agents.allowedBackends`, `agents.teamsEnabled`
- `skills.enabled`, `skills.disabled`, `skills.autoInvoke`
- `instructions.template`, `instructions.syncFormats`
- `hooks.presets`
- `context.injectGitStatus`, `context.injectTodos`, `context.injectSprintContext`
- `attachments.allowImages`, `attachments.allowFiles`
- `team.costLimitPerWorkspace`

### 2.6 Settings Panel

**Conductor:** Minimal settings (env vars, model, scripts)  
**Operator:** Tabbed settings with:
- General, Backends, Models, Privacy, Hooks, Env Vars, Shortcuts, Repos, Team, Advanced
- Backend auth status with reconnect flow
- Per-model cost display
- Hook library with pre-built hooks

---

## 3. Operator-Only Features (No Conductor Equivalent)

| Feature | Description |
|---|---|
| Agent Skills Library | 40 built-in SKILL.md skills, GUI browser, install to global/repo |
| Hooks GUI configurator | Visual builder for 12 lifecycle events, 3 handler types |
| Image/file attachments | Drag-drop, paste from clipboard into chat composer |
| @ file mentions | Fuzzy file search overlay in composer |
| ! shell injection | `!command` in composer → output appended to message |
| OPERATOR.md visual editor | Side-by-side editor + preview, byte budget, conflict detector |
| Subagent panel | Live tree of running subagents with transcript inspection |
| Agent Teams topology | Visual canvas builder for multi-agent teams (Claude Code Feb 2026) |
| Memory inspector | View/edit auto-memory notes with freshness indicators |
| Automations | Saved prompt sequences with schedule/git-hook/PR event triggers |
| Knowledge base | Repository-scoped document store for agent context |
| GitLab + Bitbucket + Azure DevOps | Full platform support (Conductor: GitHub only) |
| Windows + Linux | Cross-platform (Conductor: Mac only) |
| Team dashboard (v1.1) | Real-time shared workspace visibility across team |
| Cost attribution (v1.1) | Per-developer, per-workspace spend tracking |
| RBAC + SSO (v1.2) | Enterprise access control |
| Self-hosted deployment (v1.2) | Air-gap compatible enterprise option |

---

## 4. Environment Variable Compatibility

Operator injects both `OPERATOR_*` and `CONDUCTOR_*` versions of all variables, so `operator.json` / `conductor.json` scripts work unchanged:

```bash
# Operator primary vars
OPERATOR_WORKSPACE_NAME=tokyo
OPERATOR_WORKSPACE_PATH=/Users/.../operator/workspaces/myrepo/tokyo
OPERATOR_ROOT_PATH=/Users/.../myrepo
OPERATOR_DEFAULT_BRANCH=main
OPERATOR_PORT=3000

# Conductor compatibility aliases (exact same values)
CONDUCTOR_WORKSPACE_NAME=tokyo
CONDUCTOR_WORKSPACE_PATH=/Users/.../operator/workspaces/myrepo/tokyo
CONDUCTOR_ROOT_PATH=/Users/.../myrepo
CONDUCTOR_DEFAULT_BRANCH=main
CONDUCTOR_PORT=3000
```

---

## 5. Migration from Conductor

Operator ships a one-click Conductor migration in Settings → Advanced → Migrate from Conductor:

1. Detects `~/conductor/workspaces/` and lists all repositories
2. Imports `conductor.json` → maps all fields to `operator.json` (superset, no data loss)
3. Copies `.claude/commands/*.md` → `.operator/skills/` (creates SKILL.md wrappers)
4. Imports MCP configs from `~/.claude.json` → Operator's MCP settings
5. Migrates CLAUDE.md → OPERATOR.md (syncs back to CLAUDE.md + AGENTS.md)
6. Option to archive (not delete) Conductor workspaces

**Zero data loss.** All Conductor configuration is a subset of Operator's config schema.
