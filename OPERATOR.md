# OPERATOR.md

> Functional Specification & Product Requirements Document
> Version 2.0 · March 2026

---

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Competitive Landscape](#4-competitive-landscape)
5. [Core Concepts](#5-core-concepts)
6. [Functional Requirements](#6-functional-requirements)
   - 6.1 Repository Management
   - 6.2 Workspace Engine
   - 6.3 Agent Orchestration
   - 6.4 Chat & Composer
   - 6.5 Diff Viewer & Code Review
   - 6.6 Terminal & Script System
   - 6.7 Skill Library
   - 6.8 Slash Command Palette
   - 6.9 Hooks Engine
   - 6.10 Instruction Files (OPERATOR.md / CLAUDE.md / AGENTS.md)
   - 6.11 Checkpoint System
   - 6.12 Todos & Merge Gates
   - 6.13 Attachments & Context Injection
   - 6.14 Subagent & Agent Teams
   - 6.15 Memory Inspector
   - 6.16 Automations
   - 6.17 Knowledge Base
   - 6.18 Settings & Configuration
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Technical Architecture](#8-technical-architecture)
9. [Data Model](#9-data-model)
10. [API Contract](#10-api-contract)
11. [UI Specification](#11-ui-specification)
12. [Conductor Parity & Migration](#12-conductor-parity--migration)
13. [Security Model](#13-security-model)
14. [Release Plan](#14-release-plan)
15. [Success Metrics](#15-success-metrics)
16. [Open Questions](#16-open-questions)
17. [Appendix: Environment Variables](#appendix-a-environment-variables)
18. [Appendix: operator.json Schema](#appendix-b-operatorjson-schema)
19. [Appendix: Built-in Skill Catalogue](#appendix-c-built-in-skill-catalogue)

---

## 1. Product Vision

**Operator** is a cross-platform desktop application (macOS, Windows, Linux) that turns a single developer into an engineering team. It orchestrates fleets of AI coding agents — Claude Code, OpenAI Codex, Gemini CLI — across multiple isolated Git worktrees simultaneously, with a polished visual interface for reviewing, approving, and merging their work.

### 1.1 One-Line Summary

> *Run a team of AI agents on every platform, with the intelligence layer that makes them actually useful.*

### 1.2 Design Philosophy

Three principles, in priority order:

**1. The developer is the orchestrator, not the typist.** Operator flips the mental model from "AI assistant helping you code" to "you directing a team of agents." You assign tasks. They work. You review diffs and merge.

**2. Visual over terminal.** The power of Claude Code and Codex is real but trapped behind CLIs and JSON config files. Operator surfaces every capability — skills, hooks, checkpoints, agent teams, instruction files — through a GUI that any engineer can use on day one.

**3. Superset, never replacement.** Every Conductor feature works in Operator. Every Claude Code and Codex config file is compatible. Operator extends the ecosystem, it does not fork it.

### 1.3 What Operator Is Not

- Not a code editor (use Cursor, VS Code, or Xcode alongside it)
- Not an AI model provider (wraps existing backends)
- Not a cloud execution platform in v1.0 (all agents run locally)
- Not a team collaboration tool in v1.0 (team features arrive in v1.1)

---

## 2. Problem Statement

### 2.1 The Sequential Bottleneck

Every AI coding tool today operates sequentially. One developer, one agent, one context window, one task at a time. The agent's quality is improving fast. The developer's capacity to direct agents is the new bottleneck.

A senior engineer managing three junior developers reviews their PRs in parallel, unblocks them in rotation, and merges finished work continuously. No equivalent workflow exists for AI agents.

### 2.2 The Intelligence Layer is Hidden

Claude Code and Codex both have sophisticated capability layers — SKILL.md files, lifecycle hooks, CLAUDE.md/AGENTS.md instruction files, subagents, agent teams, MCP integrations. These are genuinely powerful. Almost no developer uses them, because accessing them requires:

- Knowing the exact file paths and directory conventions
- Writing YAML frontmatter by hand
- Editing JSON configuration files for hooks
- Understanding the Agent Skills Open Standard
- Reading documentation across three different platforms

The tooling for accessing the intelligence layer is hostile. The UI gap is wide open.

### 2.3 The Platform Gap

Conductor (the closest existing product) is macOS-only, GitHub-only, and free-only. It has no team features, no enterprise controls, no skill library, no hooks GUI, no Windows/Linux support. The parallel agent concept is proven. The market for it is 10× larger than what Conductor can reach.

---

## 3. Target Users

### 3.1 Persona 1 — The AI-Native Developer

| Attribute | Detail |
|---|---|
| Role | Full-stack engineer, 2–8 years experience |
| Platform | Mac or Windows |
| Current setup | Cursor or VS Code; Claude Pro subscription |
| Pain point | Can only run one agent at a time; loses work when context-switching tasks |
| Goal | Ship 3× faster by running agents on parallel feature branches simultaneously |
| Willingness to pay | Freemium or $25/month Pro |

**Quote:** *"I have 8 tickets to close this sprint. I want to kick them all off at once and review the diffs one by one."*

### 3.2 Persona 2 — The Engineering Lead

| Attribute | Detail |
|---|---|
| Role | Senior engineer / tech lead, 8–15 years experience, managing 4–10 developers |
| Platform | Mixed Mac/Windows team |
| Current setup | Each developer has their own disconnected AI setup |
| Pain point | No visibility into AI agent usage across the team; no shared config; costs not tracked |
| Goal | Standardize AI workflows, control costs, see team productivity metrics |
| Willingness to pay | $49/seat/month Team plan |

**Quote:** *"I need everyone using the same CLAUDE.md, the same skills, the same linting hooks — and I need to see what it's costing us."*

### 3.3 Persona 3 — The Enterprise Platform Engineer

| Attribute | Detail |
|---|---|
| Role | DevEx / platform engineer at 500+ person company |
| Platform | Linux-heavy, internal GitLab or Azure DevOps |
| Current setup | Cannot use cloud-only AI tools due to data residency requirements |
| Goal | Self-hosted deployment, SSO, RBAC, audit logs, AWS Bedrock or Azure AI |
| Willingness to pay | Enterprise contract $1,000–5,000/month |

**Quote:** *"We need all model traffic going through our Bedrock endpoint, all logs in our SIEM, and no data leaving our VPC."*

---

## 4. Competitive Landscape

### 4.1 Direct Comparison

| Feature | **Operator** | Conductor | Cursor | GitHub Copilot Workspace | Codex App |
|---|---|---|---|---|---|
| Platform | Mac + Win + Linux | **Mac only** | Mac + Win + Linux | Web only | Mac + Win |
| Parallel agents | Yes — visual | Yes — visual | No | Limited | No |
| Agent backends | Claude, Codex, Gemini | Claude + Codex | Cursor AI only | Copilot only | GPT only |
| Git platforms | GitHub, GitLab, Bitbucket, Azure DevOps, self-hosted | **GitHub only** | Any local repo | **GitHub only** | Any local repo |
| Built-in skill library | **40+ skills, GUI** | None | None | None | None |
| CLAUDE.md / AGENTS.md editor | **Visual + templates** | Raw file | None | None | None |
| Hooks GUI | **Visual builder** | None | None | None | None |
| Image attachments | Yes | No | Yes | No | Yes |
| @ file mentions | Yes | No | Yes | No | Yes |
| Subagent visualization | **Yes — live tree** | No | No | No | Partial |
| Agent Teams UI | **Yes — canvas** | No | No | No | No |
| Team dashboard | Yes (v1.1) | No | No | No | No |
| RBAC + SSO | Yes (v1.2) | No | No | Yes (Enterprise) | No |
| Self-hosted | Yes (v1.2) | No | No | No | No |
| Pricing | Freemium / $25 / $49 / Enterprise | **Free only** | Free + $20/mo | Free + Enterprise | Included w/ ChatGPT |

### 4.2 Why Operator Wins

Conductor proved the parallel agent concept. Operator extends it to everyone else: Windows developers, GitLab teams, enterprise accounts, and anyone who wants the intelligence layer (skills, hooks, attachments) without manually editing JSON files.

The Codex App is the most serious emerging competitor — it has skills, attachments, and good UI. But it is OpenAI-only and has no parallel workspace model. Operator's multi-agent, multi-backend, multi-platform positioning cannot be replicated without abandoning the product's core architecture.

---

## 5. Core Concepts

Understanding these five concepts is sufficient to understand all of Operator's features.

### 5.1 Workspace

A **workspace** is an isolated copy of a repository branch, in a dedicated directory on disk, running one AI agent. It is Operator's fundamental unit.

Internally: a Git worktree. Operator manages its lifecycle — creation, status tracking, port allocation, script execution, archiving.

Workspaces are named after cities. `tokyo`, `berlin`, `cairo`. The city name is stable; the branch name can change.

### 5.2 Agent

An **agent** is a coding AI process (Claude Code, Codex, Gemini CLI) running inside a workspace's PTY. Each workspace has at most one active agent at a time.

The agent has access to: the worktree's files, a terminal, the internet (if enabled), and any MCP servers the developer has configured.

### 5.3 Skill

A **skill** is a reusable workflow packaged as a `SKILL.md` file. It follows the Agent Skills Open Standard, which means it works in Operator, Claude Code, and Codex without modification.

Skills can be invoked explicitly with a slash command (`/code-review`) or triggered automatically when the agent detects the task matches the skill's description.

### 5.4 Checkpoint

A **checkpoint** is an automatic snapshot of a workspace's state, taken before every agent turn. Stored as a private Git ref. Allows reverting any agent turn — including all code changes and messages — without polluting the branch history.

### 5.5 Hook

A **hook** is a deterministic action that fires automatically at a specific point in the agent lifecycle. Hooks are the enforcement layer: they turn "always lint after writing a file" from a hopeful instruction into a guaranteed behavior.

---

## 6. Functional Requirements

---

### 6.1 Repository Management

#### 6.1.1 Adding a Repository

**REQ-REPO-001:** Users can add a repository from three sources:

- Local folder (select via file picker or drag directory onto app)
- Remote URL (any git-compatible URL; cloned to `~/operator/workspaces/<slug>/`)
- GitHub / GitLab search (authenticated API; autocomplete by repo name)

**REQ-REPO-002:** On add, Operator:

1. Validates the repository is a valid git repository
2. Detects the platform (GitHub, GitLab, Bitbucket, Azure DevOps, or local)
3. Reads `operator.json` if present and applies team config
4. Detects and displays the default branch
5. Resolves the repo icon from `public/favicon.*`, `apple-touch-icon.png`, etc.
6. Stores repository metadata in SQLite

**REQ-REPO-003:** Repositories are grouped in the sidebar. Workspace items are nested under their repository group.

**REQ-REPO-004:** Users can remove a repository. Removal optionally deletes all associated workspaces and worktrees. Confirmed by modal with explicit text input.

#### 6.1.2 Repository Sync

**REQ-REPO-005:** Operator fetches remote branch list and PR list on demand (sync button) and on app launch (non-blocking background sync).

**REQ-REPO-006:** When a PR is merged externally, the associated workspace's status updates to `merged` and auto-archives after 24h (configurable, default on).

---

### 6.2 Workspace Engine

#### 6.2.1 Creating a Workspace

**REQ-WS-001:** Users create workspaces via:

- `⌘N` — new workspace from default branch
- `⌘⇧N` — new workspace with options dialog (branch / PR / issue)

**REQ-WS-002:** The options dialog allows workspace creation from:

- A new branch (specify name, choose base branch)
- An existing branch (searchable list with fuzzy match)
- An open GitHub/GitLab PR (loads PR title + description as context)
- A Linear issue (loads issue title + description as agent prompt)
- A Jira issue (loads issue title + description as agent prompt)

**REQ-WS-003:** Workspace creation sequence:

1. Allocate a city name (from list of 500+ world cities; avoid duplicates within repo)
2. Allocate a port range (base port + 10 consecutive ports)
3. Create a git worktree at `~/operator/workspaces/<repo-slug>/<city-name>/`
4. Run the `setup` script if `operator.json` defines one
5. Inject `OPERATOR_*` and `CONDUCTOR_*` environment variables
6. Insert workspace record into SQLite
7. Open workspace pane in main area

**REQ-WS-004:** Workspace creation must complete within 10 seconds for a typical repository (< 50,000 files). Setup script execution time excluded.

#### 6.2.2 Workspace Status

**REQ-WS-005:** Each workspace has exactly one status at any time:

| Status | Visual | Meaning |
|---|---|---|
| `running` | ● green pulse | Agent actively executing |
| `waiting` | ● amber pulse | Agent paused, needs user input or permission |
| `needs_review` | ✓ blue | Agent completed turn, diff waiting for review |
| `idle` | ○ grey | No active agent |
| `error` | ● red | Agent crashed or fatal error |
| `blocked` | ⚠ amber | Incomplete todos prevent merge |
| `archived` | dim text | Workspace archived (worktree may still exist) |

Status changes are pushed from Rust to React via Tauri events.

#### 6.2.3 Workspace Actions

**REQ-WS-006:** Right-click context menu on workspace item:

- Open in IDE (Cursor / VS Code / Xcode / default)
- Rename workspace
- Create PR
- Fork session (open current conversation in a new workspace)
- Archive
- Delete (with worktree deletion option)
- Copy branch name
- Copy worktree path

**REQ-WS-007:** One branch can be checked out in only one workspace at a time. Attempting to create a second workspace on the same branch shows an error with suggested alternatives.

**REQ-WS-008:** Archived workspaces are hidden by default. A toggle in the sidebar header shows archived workspaces dimmed with an unarchive action.

#### 6.2.4 Spotlight Testing

**REQ-WS-009:** Spotlight mode syncs workspace changes back to the repository root directory in real time, for testing apps that assume they run from a fixed path.

Implementation: `watchexec` in Rust watches the worktree. On change, only git-tracked files are copied to repo root. A terminal in the spotlight pane points at repo root.

One spotlight-active workspace per repo at a time (exclusivity enforced). Spotlight is experimental in v1.0, graduates to stable in v1.1.

#### 6.2.5 Monorepo Support

**REQ-WS-010:** When adding a monorepo, users can select which top-level directories are visible in each workspace via a directory picker. Unselected directories are hidden via `git sparse-checkout`. The selection can be changed after workspace creation.

#### 6.2.6 Multi-Repository Workspaces

**REQ-WS-011:** The `/add-dir` slash command links additional repository workspaces to the current workspace. The agent can then read and write files across all linked workspaces.

---

### 6.3 Agent Orchestration

#### 6.3.1 Agent Backends

**REQ-AGENT-001:** Operator supports the following agent backends at launch:

| Backend | Binary | Auth method |
|---|---|---|
| Claude Code (Anthropic) | `claude` (bundled) | Claude Pro/Max session or API key |
| OpenAI Codex | `codex` (bundled) | ChatGPT account or API key |
| Gemini CLI | `gemini` | Google account (roadmap v1.1) |

**REQ-AGENT-002:** The active backend is selectable per workspace via the model picker in the composer. Changing backends on an active workspace restarts the agent process.

**REQ-AGENT-003:** Operator bundles its own validated versions of Claude Code and Codex at `~/Library/Application Support/com.operator.app/bin/`. Users must not modify these binaries.

#### 6.3.2 Starting an Agent

**REQ-AGENT-004:** An agent starts when the user sends the first message in a workspace. The agent process is spawned via `portable-pty` with:

- Working directory = worktree path
- Environment = user's shell environment + `OPERATOR_*` env vars + direnv overrides
- Model and reasoning level from workspace settings

**REQ-AGENT-005:** The agent's PTY output streams in real time to the embedded xterm.js terminal. Chunks are batched within each animation frame (60fps max update rate).

#### 6.3.3 Stopping and Background

**REQ-AGENT-006:** `⌘⇧⌫` stops the active agent. A stop confirmation is shown if the agent is mid-turn (not idle).

**REQ-AGENT-007:** `Ctrl+B` sends the agent to background. The agent continues running; the workspace tab shows a "bg" badge with a pulse indicator. Output continues streaming to the terminal. When the agent finishes, a desktop notification fires and the workspace badge updates to `needs_review`.

#### 6.3.4 Message Queuing

**REQ-AGENT-008:** While an agent is running, new messages typed in the composer are queued (shown with a queue badge count). Queued messages are sent in order when the agent finishes its current turn, if they do not require user judgment. If the agent pauses for input, the queue is held.

#### 6.3.5 Provider Routing

**REQ-AGENT-009:** Operator supports routing agent API calls through alternative providers by setting environment variables in Settings → Env Vars:

| Provider | Variables required |
|---|---|
| AWS Bedrock | `CLAUDE_CODE_USE_BEDROCK=1`, `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| Google Vertex AI | `CLAUDE_CODE_USE_VERTEX=1`, `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_REGION` |
| OpenRouter | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY=""` |
| Vercel AI Gateway | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY=""` |
| Azure AI | `ANTHROPIC_BASE_URL`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_API_KEY=""` |

GUI provider panel shows pre-filled templates for each provider in Settings → Backends.

---

### 6.4 Chat & Composer

#### 6.4.1 Message Display

**REQ-CHAT-001:** Chat messages render in a virtualized list (react-virtual). Only visible messages are in the DOM. The list auto-scrolls to the newest message when the workspace is active.

**REQ-CHAT-002:** Agent (assistant) messages render Markdown with syntax-highlighted code blocks, GFM tables, and task list checkboxes.

**REQ-CHAT-003:** Each agent message shows:

- Model name and reasoning level (small badge)
- Turn duration in seconds (e.g. `1m 24s`)
- Token count and cost in USD (`$0.04`)
- Collapsible tool call list with count (e.g. `▸ 7 tool calls`)
- File change badges for each modified file (e.g. `[CLAUDE.md +12 -0]`) — clicking opens the diff
- Revert button (appears on hover; opens checkpoint revert modal)

**REQ-CHAT-004:** Tool call items (when expanded) show: tool name, input parameters, output summary, duration, and status (success / error / blocked by hook).

**REQ-CHAT-005:** While the agent is streaming, a `Thinking...` indicator shows with the reasoning level name. The partial message renders in real time.

#### 6.4.2 Composer

**REQ-COMP-001:** The composer is an auto-expanding textarea with a minimum height of one line and a maximum height of 8 lines before becoming scrollable.

**REQ-COMP-002:** The composer status bar (below input field) shows:

- Execution mode toggle: `Local ⌄` / `Cloud ⌄`
- Permission level toggle: `Read-only ⌄` / `Ask ⌄` / `Full access ⌄`
- Branch name indicator: `⎇ main`

**REQ-COMP-003:** The composer toolbar shows:

- `+` → attachment picker (images, files, screenshots)
- Model picker (shows current backend + model name)
- Reasoning level picker (Fast / Medium / High / Max)
- Microphone button → voice input (Web Speech API; transcript inserted into composer)
- Send button (`→`) or `Enter` to send; `Shift+Enter` for newline

**REQ-COMP-004:** Pressing `/` in the composer opens the slash command palette anchored to the cursor position. Pressing `@` opens the file mention overlay. Pressing `Escape` in either overlay returns focus to the composer without sending.

**REQ-COMP-005:** Lines beginning with `!` in the composer are shell injection lines. On send, they execute in the workspace directory via `invoke("run_shell_command")` and their output is appended to the message before sending to the agent.

#### 6.4.3 Voice Input

**REQ-COMP-006:** The microphone button activates voice recording. Speech is transcribed via the Web Speech API. The transcription appends to the current composer text. A second click or pressing `Escape` stops recording.

---

### 6.5 Diff Viewer & Code Review

#### 6.5.1 Diff Display

**REQ-DIFF-001:** The diff viewer opens via:

- `⌘D` keyboard shortcut
- Clicking any file change badge in a chat message
- Selecting the "Changes" tab in the right panel

**REQ-DIFF-002:** The diff viewer uses CodeMirror 6 `MergeView` in side-by-side mode. Features:

- Syntax highlighting for all detected languages (JS, TS, Python, Rust, PHP, Ruby, Go, SQL, CSS, HTML, JSON, Markdown, and more)
- Collapsible unchanged regions (3-line context, minimum 4-line block to collapse)
- "Viewed" checkbox per file — persists in SQLite; resets on new agent turn
- `[` / `]` keys to navigate previous/next file
- `n` / `p` keys to navigate previous/next hunk

**REQ-DIFF-003:** Language extensions are loaded lazily — only when a file of that type is first opened. First load takes ≤ 200ms; subsequent files of the same type are instant.

**REQ-DIFF-004:** The diff viewer shows a file tree on the left (via react-arborist). Modified files show an amber dot indicator. Untracked files show a `?` prefix.

#### 6.5.2 Inline Comments

**REQ-DIFF-005:** Clicking and dragging in the diff gutter selects a line range and opens a comment composer.

**REQ-DIFF-006:** Comments are stored in SQLite and displayed inline in the diff. Comments from GitHub/GitLab PR reviews are synced and shown with the author avatar and timestamp.

**REQ-DIFF-007:** Comments become "outdated" and are hidden when the lines they reference change. A "Show outdated" toggle reveals them.

#### 6.5.3 Review Actions

**REQ-DIFF-008:** The diff viewer bottom bar shows:

- `← Prev file` / `Next file →` navigation
- `Create PR` button (opens PR creation modal)
- `Discard changes` button (confirmation required; resets to HEAD)

**REQ-DIFF-009:** `Create PR` pre-populates title from the branch name (formatted) and body from the agent's last message summary. Users can edit before submitting.

---

### 6.6 Terminal & Script System

#### 6.6.1 Terminal

**REQ-TERM-001:** Each workspace has an embedded terminal panel (bottom panel, Terminal tab). The terminal is a full PTY instance via `portable-pty` rendered with xterm.js and the WebGL renderer addon.

**REQ-TERM-002:** Multiple terminal sessions per workspace. A `+` button in the tab bar creates a new session. Each session is a separate PTY; sessions can be renamed.

**REQ-TERM-003:** `⌘F` inside the terminal opens the xterm.js search overlay. `Escape` closes it.

**REQ-TERM-004:** The terminal panel automatically resizes when the bottom panel is resized. Resize events are debounced at 50ms before notifying the PTY.

#### 6.6.2 Scripts

**REQ-SCRIPT-001:** Three script types per repository:

| Script | When it runs | Purpose |
|---|---|---|
| `setup` | On workspace creation | Install deps, copy .env, symlink files |
| `run` | When user clicks Run button | Start dev server, test runner |
| `archive` | On workspace archive | Cleanup, resource release |

**REQ-SCRIPT-002:** Scripts run in zshell with the workspace's full environment. The working directory is the worktree path.

**REQ-SCRIPT-003:** The `run` script receives `$OPERATOR_PORT` (first of 10 allocated ports). Multiple services in one run script must use `concurrently` — using `&` for backgrounding is detected and warned against at script save time.

**REQ-SCRIPT-004:** `Run script mode` setting per repository:

- `Concurrent` (default): multiple run scripts can execute simultaneously
- `Nonconcurrent`: clicking Run kills any in-progress run before starting a new one

**REQ-SCRIPT-005:** Scripts, run mode, and all operator.json fields can be shared with the team by committing `operator.json` to git. Personal settings in Repository Settings override `operator.json` — users must clear personal settings to adopt the team config.

#### 6.6.3 direnv Support

**REQ-SCRIPT-006:** If a `.envrc` file exists in the worktree directory, its environment is loaded automatically before spawning agent processes and running scripts. No user configuration required.

---

### 6.7 Skill Library

#### 6.7.1 What Skills Are

**REQ-SKILL-001:** Skills are `SKILL.md` files packaged in a named directory. They follow the Agent Skills Open Standard and are compatible with Claude Code (`.claude/skills/`) and Codex (`.agents/skills/`) without modification.

**REQ-SKILL-002:** A `SKILL.md` file has two parts:

1. YAML frontmatter (between `---` markers): `name`, `description`, `allowed-tools`, `context`, `agent`, `auto-invoke`
2. Markdown body: instructions the agent follows when the skill activates

**REQ-SKILL-003:** Skills activate in two ways:

- **Explicit**: User types `/skill-name` in the composer
- **Implicit**: Operator and the agent compare the current task context to all available skill descriptions. If a match exceeds the confidence threshold, the skill loads automatically (badge shown in composer)

#### 6.7.2 Skill Scopes

**REQ-SKILL-004:** Three skill scopes:

| Scope | Storage path | Availability |
|---|---|---|
| Built-in | Bundled with Operator | All workspaces, all repos |
| Global | `~/.operator/skills/<name>/` | All workspaces, all repos |
| Repo | `<repo>/.operator/skills/<name>/` | Only workspaces in that repo |

**REQ-SKILL-005:** When two skills share the same name, the most-specific scope wins: Repo > Global > Built-in.

#### 6.7.3 Skill Library UI

**REQ-SKILL-006:** The Skill Library panel (sidebar → Skills, or `/skills`) shows:

- Category filter (Code Quality, Testing, Documentation, Security, Git & PR, Architecture, DevOps, Frameworks)
- Searchable skill list with name, description, and source badge (Built-in / Global / Repo)
- SKILL.md preview pane (right panel)
- Install button: scope picker (Global / Repo) then writes the SKILL.md to disk
- `+ New Skill` button: opens a blank SKILL.md editor with frontmatter template

**REQ-SKILL-007:** Skills with `auto-invoke: true` (the default) show an "Auto" badge. Users can disable auto-invocation per skill. Skills with `context: fork` spawn an isolated subagent and show a "Fork" badge.

#### 6.7.4 Built-in Skill Catalogue (40 skills at launch)

Eight categories, five skills each on average. Full list in Appendix C. Representative examples:

| Skill | Command | Auto-invokes when |
|---|---|---|
| Code Review | `/code-review` | User asks to review code or a PR |
| Write Tests | `/write-tests` | User asks to add tests or increase coverage |
| Security Audit | `/security-audit` | User mentions OWASP, injection, vulnerabilities |
| Create PR | `/create-pr` | User asks to open a PR or push changes |
| Deep Research | `/deep-research` | User asks to research a technology or problem |
| Drupal Module | `/drupal-module` | Framework: Drupal detected in repo |
| Laravel Feature | `/laravel-feature` | Framework: Laravel detected in repo |
| Architecture Doc | `/architecture-doc` | User asks to document system design |

---

### 6.8 Slash Command Palette

**REQ-CMD-001:** The slash command palette opens via `⌘K` (global) or by typing `/` in the composer. It is a full-screen overlay with three panes:

1. **Category sidebar** — All, Favorites, Built-in, Code Quality, Testing, Documentation, Security, Git & PR, Architecture, DevOps, Frameworks
2. **Command list** — name, description, source badge; sorted by usage frequency with pinned items at top
3. **Preview pane** — full SKILL.md content for skill-based commands; description for built-in commands

**REQ-CMD-002:** Search across the palette is powered by fuse.js over command name, description, and category. Results update on every keystroke. Empty state shows recently used commands.

**REQ-CMD-003:** Commands that accept arguments (skills with `$ARGUMENTS` in their SKILL.md) show an inline argument input field before dispatch.

**REQ-CMD-004:** Users can pin/unpin commands (star icon). Pinned commands appear first, persist via localStorage.

**REQ-CMD-005:** Built-in commands (not skills):

| Command | Action |
|---|---|
| `/clear` | Clear workspace chat context; preserve checkpoints |
| `/compact` | Compact conversation history to reduce context size |
| `/model [name]` | Switch agent model in this workspace |
| `/skills` | Open Skill Library panel |
| `/todos` | Open Todos panel |
| `/diff` | Open Diff Viewer |
| `/checkpoint` | Manually create a checkpoint now |
| `/revert` | Open checkpoint picker to revert to a previous turn |
| `/context` | Show current context window usage and skill budget |
| `/add-dir [path]` | Link additional directory to this workspace |
| `/pr [title]` | Create GitHub/GitLab PR for current workspace branch |
| `/review` | Spawn separate review subagent to check changes |
| `/rename [name]` | Rename this workspace |
| `/fork` | Fork current session into a new workspace |
| `/agent [type]` | Spawn named subagent: explore, plan, review, or custom |
| `/team` | Open Agent Teams topology builder |
| `/hooks` | Open Hooks configurator |
| `/memory` | Open Memory inspector |
| `/search [query]` | Live web search within workspace context |
| `/loop` | Enter autonomous loop: agent continues until all todos resolved |

---

### 6.9 Hooks Engine

#### 6.9.1 What Hooks Do

**REQ-HOOK-001:** Hooks are deterministic actions that execute automatically at specific lifecycle events. They transform best practices from suggestions into enforced rules. A hook never forgets; it fires every time.

**REQ-HOOK-002:** Three hook handler types:

| Type | How it works | Best for |
|---|---|---|
| `command` | Shell script receives JSON on stdin, communicates via exit code and stdout | Deterministic ops: lint, format, block commands |
| `prompt` | Single-turn LLM evaluation with `$ARGUMENTS` context placeholder | Context-sensitive decisions too complex for regex |
| `agent` | Spawns a full subagent with Read, Grep, Glob tools | Deep codebase verification before allowing actions |

#### 6.9.2 Lifecycle Events

**REQ-HOOK-003:** 12 lifecycle events:

| Event | Fires when | Can block? | Key use cases |
|---|---|---|---|
| `UserPromptSubmit` | User sends a message | Yes | Prompt validation, context injection, keyword blocking |
| `PreToolUse` | Before any tool call | Yes | Block rm -rf, enforce style, require approval |
| `PermissionRequest` | Agent requests tool permission | Yes | Auto-approve safe tools, escalate risky ones |
| `PostToolUse` | After a tool call succeeds | No | Auto-format, run linter, send webhook |
| `PostToolUseFailure` | After a tool call fails | No | Error logging, alert on repeated failures |
| `Stop` | Agent finishes responding | Yes | Verify task completion, send desktop notification |
| `SubagentStart` | A subagent is spawned | No | Log creation, inject context |
| `SubagentStop` | A subagent completes | Yes | Verify output quality before returning to parent |
| `Notification` | Agent sends a system notification | No | Desktop alerts for permission requests, idle |
| `SessionStart` | Session starts or resumes | No | Load sprint context, inject git status |
| `SessionEnd` | Session ends | No | Log summary, clean temp files |
| `PreCompact` | Before context compaction | No | Backup transcript, preserve state |

#### 6.9.3 Hooks GUI

**REQ-HOOK-004:** The Hooks configurator (Settings → Hooks, or `/hooks`) shows:

- **Pre-built library** (toggle each on/off):
  - Auto-Format Python (`PostToolUse`, `Write(*.py)` → `black`)
  - Auto-Format JS/TS (`PostToolUse`, `Write(*.{js,ts,jsx,tsx})` → `prettier`)
  - Block rm -rf (`PreToolUse`, `Bash` → regex check)
  - Block .env reads (`PreToolUse`, `Read(.env*)`)
  - Run tests on stop (`Stop` → `npm test` / `pytest`)
  - Security guard (`PreToolUse`, `Edit` → LLM eval for auth/payments)
  - Desktop notification (`Notification` → OS alert)
  - Sprint context inject (`SessionStart` → git status + recent commits)
  - Audit log (`PostToolUse` → append to `.operator/audit.log`)
  - Lint before commit (`PreToolUse`, `Bash:git commit` → ESLint/Pylint)

- **Custom hook builder**:
  - Event picker (dropdown with descriptions)
  - Tool matcher input
  - Handler type radio (Command / LLM Prompt / Subagent)
  - Handler input (textarea adapts to type)
  - `Test Hook` button: runs against synthetic input, shows output in modal
  - `Save` button: writes to `settings.json`
  - `settings.json preview` accordion: shows generated JSON before save

**REQ-HOOK-005:** Hooks can be scoped to: global (all repos), specific repo, or specific workspace. Scope selector in the hooks panel header.

**REQ-HOOK-006:** Hook configurations can be exported as `operator-hooks.json` and imported by teammates. Committed to git alongside `operator.json` as `.operator/hooks.json`.

---

### 6.10 Instruction Files

#### 6.10.1 File Types and Hierarchy

**REQ-INST-001:** Operator uses `OPERATOR.md` as its canonical instruction file. On save, it auto-syncs to:

- `CLAUDE.md` — for Claude Code compatibility
- `AGENTS.md` — for Codex compatibility

Auto-sync can be disabled per-repo in `operator.json` via `"instructions": { "syncFormats": false }`.

**REQ-INST-002:** Instruction file hierarchy (lower = higher precedence):

```
~/.operator/OPERATOR.md          ← global (all repos)
<repo-root>/OPERATOR.md          ← project (all workspaces in repo)
<repo-root>/src/OPERATOR.md      ← subdirectory (workspaces in src/)
OPERATOR.override.md             ← temporary override (not committed)
```

Combined chain is assembled in Rust and passed to agents. Total chain is capped at 32 KiB (configurable via `project_doc_max_bytes` in `operator.json`).

#### 6.10.2 Visual Editor

**REQ-INST-003:** The Instruction Editor (accessible by clicking the instruction file indicator in the status bar, or via file tree) shows:

- **Scope tabs**: Global | Repo Root | Subdirectory | Overrides
- **Left pane**: Markdown editor with syntax highlighting
- **Right pane**: Combined preview — what Claude/Codex actually sees
- **Budget indicator**: Real-time byte counter (e.g. `8.2 / 32 KiB ████░░`)
- **Conflict detector**: Highlights directives that contradict across scopes (e.g. "use npm" vs "use pnpm"), listed below the editor
- **Version history**: Git-tracked changes shown as a diff timeline

**REQ-INST-004:** Template library — 8 built-in templates (Next.js, Django, Laravel TALL, Drupal 10, Rails, React Native, Turborepo monorepo, Generic API). Applying a template pre-fills the project-scope instruction file with stack-specific conventions.

---

### 6.11 Checkpoint System

**REQ-CHKPT-001:** A checkpoint is created automatically before every agent turn begins. The checkpoint captures the complete working tree state via a git commit to `refs/operator/checkpoints/<workspace_id>/<turn_id>`. This ref is private — it does not appear in `git log` and does not push to remotes.

**REQ-CHKPT-002:** Each checkpoint stores:

- Git SHA of the snapshot commit
- Turn ID (links to the user message that triggered the turn)
- Timestamp
- First line of the user message (for display in the revert modal)

**REQ-CHKPT-003:** To revert to a checkpoint:

1. Hover over any user message in the chat
2. Click the revert icon (↩) that appears on hover
3. Confirm in the modal (warns that messages + code changes from that turn onward are **permanently deleted**)
4. Operator executes a hard reset to the checkpoint commit and deletes all subsequent messages from SQLite

**REQ-CHKPT-004:** Checkpoints are stored locally only. They are never pushed to remote.

**REQ-CHKPT-005:** Checkpoint retention: 30 days by default (configurable 7 / 30 / 90 days in Settings → Advanced). Background cleanup job runs at app startup and every 24h.

**REQ-CHKPT-006:** Checkpoints are supported for Claude Code in v1.0. Codex checkpoint support requires Codex's hook system and ships in v1.2.

---

### 6.12 Todos & Merge Gates

**REQ-TODO-001:** Each workspace has a Todos panel (Notes tab in bottom panel, or `/todos`). Todos are tasks that must be completed before the workspace can be merged.

**REQ-TODO-002:** Todos are added:

- Manually by the developer (type and press Enter)
- By the agent, via `@todos` tag in a message (e.g. "I've added @todos for the remaining test cases")
- Automatically when the agent detects incomplete work in its own response

**REQ-TODO-003:** The Create PR and Merge buttons are **disabled** as long as any unchecked todo exists for the workspace. The disabled state shows a tooltip: "2 todos must be completed before merging."

**REQ-TODO-004:** Todos persist in SQLite. They survive app restarts and agent kills.

**REQ-TODO-005:** The agent can check off todos as it completes tasks (Claude Code's todo tracking feature, surfaced in Operator's panel). Manually added todos cannot be checked by the agent unless the developer enables "Agent can check todos" in workspace settings.

---

### 6.13 Attachments & Context Injection

#### 6.13.1 File and Image Attachments

**REQ-ATTACH-001:** Users attach files and images to composer messages via:

- `+` button → file picker dialog
- Drag and drop files onto the composer
- Paste from clipboard (images only — screenshots, design mockups)

**REQ-ATTACH-002:** Supported attachment types:

| Type | Formats | Agent capability |
|---|---|---|
| Image | PNG, JPEG, WebP, GIF | Vision: describe UI, read diagrams, implement from mockup |
| Code file | Any text file | Agent reads full content at send time |
| PDF | .pdf | Text extraction; useful for specs and tickets |
| CSV / JSON / YAML | Structured data | Agent parses and reasons about structure |
| Git diff / patch | .diff, .patch | Agent applies or explains changes |

**REQ-ATTACH-003:** Attached files are shown as thumbnail chips in the attachment row above the composer input. Each has a remove button. Images show an inline thumbnail.

**REQ-ATTACH-004:** File content is read at send time (not at attachment time), so the agent always receives the current version.

#### 6.13.2 @ File Mentions

**REQ-ATTACH-005:** Typing `@` in the composer opens the file mention overlay, anchored at the cursor position. The overlay shows a fuzzy-matched list of files from the workspace's git index (updated by `notify` file watcher).

**REQ-ATTACH-006:** Arrow keys navigate the list; Tab or Enter selects the highlighted file. The file path is inserted as a styled `@token` in the composer text. Multiple `@` mentions are supported in a single message.

**REQ-ATTACH-007:** When the message is sent, each `@filename` is replaced with the full file content in a fenced code block. The original `@filename` token is preserved in the UI for readability.

#### 6.13.3 Automatic Context Injection

**REQ-ATTACH-008:** Operator automatically injects the following into every new workspace session (all configurable in `operator.json`):

| Context | What's injected | Default |
|---|---|---|
| Git status | Current branch, uncommitted file list, last 3 commits | On |
| OPERATOR.md chain | Full combined instruction file | Always on |
| Active todos | Unchecked todo items for this workspace | On |
| Skill descriptions | Names and descriptions of available skills (up to budget) | On |
| PR context | PR title, description, review comments (if workspace created from PR) | On |
| Sprint context | Current tasks from Linear/Jira MCP | Off (requires MCP) |
| Environment summary | Node/Python/framework versions detected | On |

---

### 6.14 Subagent & Agent Teams

#### 6.14.1 Subagent Panel

**REQ-SUBAG-001:** When an agent spawns a subagent (via Claude Code's Task tool or Codex's agent delegation), Operator renders a live subagent tree in the right panel → Agents tab.

**REQ-SUBAG-002:** Each subagent node shows:

- Type (Explore / Plan / custom name)
- Status (running / waiting / complete / error)
- Token count and elapsed time
- Background indicator (bg badge) if agent sent itself to background

**REQ-SUBAG-003:** Clicking a subagent node expands its transcript — showing what the subagent is working on, tool calls, and output.

**REQ-SUBAG-004:** Each subagent node has a Kill button (terminates the subprocess without affecting the parent).

#### 6.14.2 Agent Teams

**REQ-AGTEAM-001:** Agent Teams (Claude Code experimental feature, enabled since Feb 2026) allow multiple independent Claude sessions to coordinate, message each other, and self-assign parallel tasks.

**REQ-AGTEAM-002:** The Agent Teams topology builder (accessed via `/team` or Settings → Advanced → Agent Teams) shows a drag-and-drop canvas. Each agent is a card showing: name, model, system prompt excerpt, current task, token spend.

**REQ-AGTEAM-003:** Pre-built team templates:

- Frontend + Backend + QA
- Planner + Coder + Reviewer
- Researcher + Writer + Editor
- Architect + Multiple Implementers

**REQ-AGTEAM-004:** A shared task list panel allows teams to self-assign from a central backlog. Completed tasks are checked off by agents automatically.

**REQ-AGTEAM-005:** Cost projection shown before starting a team task (estimated total token spend based on team size and task description).

**REQ-AGTEAM-006:** Agent Teams are enabled via: Settings → Advanced → Experimental → Agent Teams. Operator sets `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in the workspace environment automatically.

---

### 6.15 Memory Inspector

**REQ-MEM-001:** Claude Code's Auto Memory feature writes notes to `~/.claude/projects/<project>/memory/` during sessions. Operator surfaces these as a browsable, editable panel (right panel → Memory tab).

**REQ-MEM-002:** The Memory panel shows:

- Each note with its content, source (agent / manual), and last-modified timestamp
- A "freshness" indicator: notes older than 14 days are flagged as potentially stale
- A "health score": count of fresh vs stale notes, and count of conflicting notes detected

**REQ-MEM-003:** Users can edit notes inline, delete individual notes, or mark all notes as stale for the next session.

**REQ-MEM-004:** Memory notes can be exported as a structured JSON file for backup or migration.

---

### 6.16 Automations

**REQ-AUTO-001:** Automations are saved agent tasks with a trigger. They appear in the sidebar → Automations section.

**REQ-AUTO-002:** Trigger types:

| Trigger | Example |
|---|---|
| `schedule` | Daily at 9am — run `/code-review` on open PRs |
| `git_hook` | Pre-commit — run security scan before any commit |
| `pr_event` | PR opened — generate PR description from diff |
| `manual` | Button click — deploy checklist before release |

**REQ-AUTO-003:** Automation creation: trigger type → trigger config → agent prompt → model + reasoning level → enable/disable.

**REQ-AUTO-004:** Automation history shows: name, trigger, last run time, last run status (success / error / running), and a log of the last run's output.

---

### 6.17 Knowledge Base

**REQ-KB-001:** The Knowledge Base (sidebar → Knowledge) is a repository-scoped document store that provides persistent context to agents.

**REQ-KB-002:** Documents can be added by:

- Uploading a file (PDF, markdown, text)
- Pasting a URL (fetched and converted to markdown)
- Creating a note directly in Operator

**REQ-KB-003:** Knowledge documents are referenced in `OPERATOR.md` so agents know they exist. Agents fetch specific documents when relevant rather than loading all at once (progressive disclosure pattern).

**REQ-KB-004:** Knowledge documents are stored locally in `.operator/knowledge/` in the repository. They are not committed to git by default (listed in `.gitignore`). A "Share with team" option copies to a committed path.

---

### 6.18 Settings & Configuration

Full settings specification in `10-settings.md`. Summary of panels:

| Panel | Key settings |
|---|---|
| General | Theme, font, font size, default IDE, base port, update channel |
| Backends | Claude Code auth, Codex auth, Gemini auth, custom provider config |
| Models | Per-backend model defaults, reasoning level defaults, context window size |
| Privacy | Analytics toggle, crash reporting, log retention, checkpoint retention |
| Hooks | Pre-built hook library, global custom hooks |
| Env Vars | Global environment variables, per-provider templates, secret storage |
| Shortcuts | Keyboard shortcut customization |
| Repositories | List all repos, per-repo settings link |
| Team | Team plan status, member management (v1.1) |
| Advanced | Parallel workspace limit, checkpoint retention, debug mode, experimental features, migration tools |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| Metric | Target |
|---|---|
| Cold start to interactive UI | < 400ms |
| Idle RAM, 1 workspace | < 50 MB |
| Additional RAM per workspace | < 15 MB |
| PTY output render latency | < 16ms (60fps) |
| Diff viewer open, 10k-line file | < 200ms |
| Slash command palette open | < 50ms |
| File tree render, 10k files | < 100ms |
| @ mention search response | < 30ms |
| Workspace switch latency | < 50ms |
| Checkpoint creation | < 500ms |

### 7.2 Reliability

**REQ-NFR-001:** A crash in one workspace (agent crash, PTY failure) must not affect other workspaces. Each workspace is isolated in its own React error boundary and Rust process group.

**REQ-NFR-002:** App must recover gracefully from unexpected shutdown. On next launch, active workspace states are restored from SQLite. Agents are not auto-restarted (user re-starts manually).

**REQ-NFR-003:** SQLite writes use WAL mode. Concurrent writes from N simultaneous agent sessions must not cause database corruption.

### 7.3 Security

**REQ-NFR-004:** API keys and credentials are stored exclusively in the OS keychain (macOS Keychain / Windows Credential Manager / Linux libsecret). They are never written to disk, SQLite, or transmitted in IPC events.

**REQ-NFR-005:** The Tauri capability system limits what the webview can do. JavaScript cannot access the filesystem, OS, or network directly. All sensitive operations go through explicit Rust command handlers.

**REQ-NFR-006:** Source code, chat history, and file contents are never sent to Operator's servers. Model API traffic goes directly to the provider.

### 7.4 Privacy

**REQ-NFR-007:** Analytics are opt-out (not opt-in). Users can disable all analytics via Settings → Privacy or by setting `enterpriseDataPrivacy: true` in `operator.json`.

**REQ-NFR-008:** Analytics never include: source code, file names, chat content, API keys, branch names, or repository URLs. Only anonymized event names and aggregated metrics.

### 7.5 Accessibility

**REQ-NFR-009:** All interactive UI elements are keyboard-accessible. Focus management follows ARIA patterns.

**REQ-NFR-010:** The slash command palette (`cmdk`) is screen-reader compatible.

**REQ-NFR-011:** Color is never the sole indicator of state (status icons use both color and shape/glyph).

### 7.6 Internationalization

**REQ-NFR-012:** UI text is in English for v1.0. RTL layout support deferred to v2.0.

**REQ-NFR-013:** File paths and repository names containing non-ASCII characters must not cause crashes or corrupted state.

---

## 8. Technical Architecture

### 8.1 Stack Summary

| Layer | Technology |
|---|---|
| Desktop framework | Tauri 2.x (Rust core + WebView) |
| Frontend | React 19 + TypeScript + Vite 6 |
| Styling | Tailwind CSS v4 |
| State | Zustand + Immer |
| Git operations | libgit2 via `git2` crate |
| Agent processes | `portable-pty` crate |
| Database | SQLite via `sqlx` |
| File watching | `notify` crate |
| Credentials | `keyring` crate |
| Logging | `tracing` crate (Rust) + custom Logger (React) |
| Analytics | PostHog |
| Crash reporting | Sentry (opt-in) |

### 8.2 Platform WebViews

| Platform | WebView | PTY | Notes |
|---|---|---|---|
| macOS | WKWebView | POSIX PTY | Primary development target |
| Windows | WebView2 (Edge-based) | ConPTY | WebView2 bundled in installer; experimental in v0.1 |
| Linux | WebKitGTK | POSIX PTY | AppImage + .deb + .rpm packages |

### 8.3 Key Architectural Decisions

**Bundled binaries:** Claude Code and Codex are bundled with Operator at a tested, compatible version. Users do not install them separately. This eliminates PATH issues and ensures compatibility. Binaries are updated via Operator releases.

**Single SQLite database:** All local data — workspaces, messages, checkpoints, todos, skills, hooks — in one database. WAL mode handles concurrent workspace writes. No remote database.

**Keep all workspaces mounted:** Inactive workspace panes use `display: none` (not unmount). This preserves terminal output, scroll position, and prevents xterm.js re-initialization on workspace switch. LRU eviction (unmount + re-mount on access) activates when more than 10 workspaces are open.

**Rust handles everything heavy:** Git ops, PTY management, file watching, checkpoint creation, shell command execution. React handles everything visual. The boundary is the Tauri IPC layer.

### 8.4 File System Paths

```
macOS
  Workspaces:     ~/operator/workspaces/<repo-slug>/<city-name>/
  App data:       ~/Library/Application Support/com.operator.app/
  Database:       ~/Library/Application Support/com.operator.app/operator.db
  Logs:           ~/Library/Logs/Operator/operator.log
  Global config:  ~/.operator/

Windows
  Workspaces:     %USERPROFILE%\operator\workspaces\<repo-slug>\<city-name>\
  App data:       %APPDATA%\com.operator.app\
  Database:       %APPDATA%\com.operator.app\operator.db
  Global config:  %USERPROFILE%\.operator\

Linux
  Workspaces:     ~/operator/workspaces/<repo-slug>/<city-name>/
  App data:       ~/.local/share/com.operator.app/
  Database:       ~/.local/share/com.operator.app/operator.db
  Global config:  ~/.operator/
```

---

## 9. Data Model

*Full SQL DDL in `04-database-schema.md`. Summary of core entities:*

### Repositories

`id`, `name`, `full_name`, `remote_url`, `local_path`, `platform`, `default_branch`, `operator_json`

### Workspaces

`id`, `repository_id`, `city_name`, `branch_name`, `worktree_path`, `status`, `agent_backend`, `model`, `port_base`, `total_cost_usd`, `total_tokens`, `is_archived`

### Messages

`id`, `workspace_id`, `role`, `content`, `turn_id`, `model`, `tool_calls` (JSON), `file_changes` (JSON), `duration_ms`, `cost_usd`

### Checkpoints

`id`, `workspace_id`, `turn_id`, `git_sha`, `git_ref`, `description`

### Todos

`id`, `workspace_id`, `text`, `completed`, `source` (manual | agent)

### Skills

`id`, `name`, `description`, `category`, `skill_md`, `install_scope`, `is_builtin`

### Hooks

`id`, `repository_id`, `event`, `matcher`, `handler_type`, `handler`, `is_enabled`, `is_preset`

### Settings

Key-value store. All values serialized as JSON strings.

---

## 10. API Contract

*Full Tauri IPC command reference in `05-api-design.md`. Summary of command categories:*

**Repository commands:** `list_repositories`, `add_repository`, `remove_repository`, `sync_repository`, `list_branches`, `list_open_prs`

**Workspace commands:** `create_workspace`, `list_workspaces`, `archive_workspace`, `delete_workspace`, `rename_workspace`, `open_workspace_in_ide`, `run_setup_script`, `run_run_script`, `stop_run_script`

**Agent commands:** `start_agent`, `send_message`, `queue_message`, `stop_agent`, `cancel_tool_call`

**Git commands:** `get_diff`, `get_file_content`, `list_changed_files`, `create_commit`, `push_branch`, `create_pr`, `revert_to_checkpoint`, `list_checkpoints`, `list_workspace_files`

**Shell commands:** `run_shell_command`, `create_terminal_session`, `write_terminal`, `resize_terminal`

**Skill commands:** `list_skills`, `install_skill`, `uninstall_skill`, `create_custom_skill`

**Settings commands:** `get_settings`, `update_settings`, `get_auth_status`, `authenticate_backend`

**Tauri events (Rust → React):** `agent_output`, `workspace_status_changed`, `checkpoint_created`, `diff_updated`, `hook_triggered`, `cost_updated`, `desktop_notification`

---

## 11. UI Specification

*Full wireframes for all 9 screens in `02-ui-layout-screens.md`. Summary:*

### Global Layout

Three-panel layout: left sidebar (240px, resizable 180–320px), main area (flex), right panel (optional, collapsible, min 280px). Bottom panel (collapsible, min 120px).

### Left Sidebar

Top section: workspace list grouped by repo. Bottom section: Skills, Automations, Knowledge, Settings, Feedback. Workspace items show city name, branch name, status indicator, cost badge, todo count badge.

### Main Area

Tab bar at top (one tab per open workspace). Tab shows: workspace name, status indicator, cost. Main pane shows either: Empty state (new thread prompt + suggestion cards), or Workspace chat view.

### Right Panel

Three tabs: All Files (file tree), Changes (diff viewer), Checks (CI status). Collapsible via drag or toggle button.

### Bottom Panel

Three tabs: Setup (setup script output), Run (run script, dev server), Terminal (full PTY). `+` button adds a new terminal session.

### Composer

Attachment row (above input, conditional). Auto-expanding textarea. Toolbar: `+`, model picker, reasoning picker, mic, send. Status bar: execution mode, permission level, branch.

---

## 12. Conductor Parity & Migration

*Full parity matrix (50 rows) in `09-conductor-parity.md`. Key points:*

### Compatibility Guarantee

Operator supports every feature Conductor documents. `conductor.json` scripts work without modification. `CONDUCTOR_*` environment variables are injected alongside `OPERATOR_*` with identical values. `.claude/commands/` files are recognized as skills.

### One-Click Migration

Settings → Advanced → Migrate from Conductor:

1. Detects `~/conductor/workspaces/` and lists repositories
2. Imports `conductor.json` → `operator.json` (full fidelity, no data loss)
3. Converts `.claude/commands/` to `.operator/skills/` with SKILL.md wrappers
4. Migrates MCP configs from `~/.claude.json`
5. Migrates `CLAUDE.md` → `OPERATOR.md` (syncs back to `CLAUDE.md` + `AGENTS.md`)
6. Option to archive Conductor workspaces

### What Operator Adds Beyond Conductor

40-skill built-in library, visual hooks configurator, image/file attachments, @ file mentions, ! shell injection, OPERATOR.md visual editor, subagent panel, Agent Teams topology builder, Memory inspector, Automations, Knowledge base, GitLab + Bitbucket + Azure DevOps support, Windows + Linux, team dashboard (v1.1), RBAC + SSO (v1.2), self-hosted deployment (v1.2).

---

## 13. Security Model

### Credential Storage

All API keys stored in OS keychain via `keyring` crate. Never in SQLite, operator.json, environment files, or IPC payloads. The webview (JavaScript) never has direct access to credentials.

### Tauri Capability System

`tauri.conf.json` declares exactly which Rust commands the webview can invoke. No filesystem, network, or OS access from JavaScript by default. All sensitive operations are gated through explicitly declared Rust handlers.

### Agent Permissions

Agents run as the logged-in user. No additional sandboxing in v1.0. Enterprise plan (v1.2) adds:

- macOS: `sandbox-exec` seatbelt
- All platforms: Docker-based workspace isolation
- Network allowlists for agent subprocesses

### Data Residency

| Data type | Location | Leaves device? |
|---|---|---|
| Source code | Local worktree | Never |
| Chat history | Local SQLite | Never |
| Model API traffic | Direct to provider | Via provider only |
| Checkpoints | Local Git refs | Never |
| Credentials | OS keychain | Never |
| App settings | Local JSON file | Never |
| Anonymized analytics | PostHog | Yes (unless disabled) |
| Crash reports | Sentry (opt-in) | Only if enabled |

### Enterprise Privacy

`enterpriseDataPrivacy: true` in `operator.json` disables all analytics, all telemetry, all crash reporting, and all non-essential network calls. Appropriate for air-gapped deployments.

---

## 14. Release Plan

### v0.1 — Alpha (Month 2)

macOS only. Core workspace engine: worktrees, Claude Code PTY, diff viewer, checkpoints. 10 built-in skills. Basic slash palette. GitHub only. Signed .dmg for internal testing.

**Definition of done:** A developer unfamiliar with Operator installs the .dmg, adds a GitHub repo, creates 3 parallel workspaces, reviews each diff, and creates a PR — without touching a terminal.

### v0.5 — Private Beta (Month 3)

Linux AppImage. GitLab + Bitbucket support. Spotlight testing. 20 built-in skills. @ file mentions. Image attachments. Hooks GUI (pre-built library). OPERATOR.md visual editor with 8 templates. operator.json schema.

### v1.0 — Public Launch (Month 5)

All platforms (Mac + Windows + Linux). All major Git platforms. All 40 built-in skills. Full hooks GUI (custom builder + test runner). Subagent panel. Memory inspector. Automations (basic). Knowledge base (basic). Freemium pricing launched. Skill library community submissions open.

### v1.1 — Team (Month 7)

Team dashboard (real-time workspace feed). Cost attribution per developer. RBAC (basic roles). Shared skill library (team-scoped skills). Team hook policies. Agent Teams topology builder graduates to stable. Gemini CLI backend.

### v1.2 — Enterprise (Month 10)

SSO (SAML 2.0 + OIDC). Advanced RBAC. Audit logs with export. Self-hosted deployment. Enterprise privacy mode. Codex checkpoints. Docker-based workspace sandbox. Agent Teams stable. Dedicated support + SLA.

### v2.0 — Platform (Month 14)

Community skill marketplace (publish and install community-built skills). Plugin system. Optional cloud-executed agents (no local machine required). Agent team templates marketplace. Auto task decomposition from plain language.

---

## 15. Success Metrics

### Product Health (v1.0, 6 months post-launch)

| Metric | Target | Measurement |
|---|---|---|
| Monthly Active Users | 5,000 MAU | App telemetry |
| Platform split (non-Mac) | ≥ 40% | OS telemetry |
| Avg. workspaces/user/day | > 3 | Session analytics |
| Retention (30-day) | > 45% | Cohort analysis |
| NPS | > 55 | In-app survey |
| Time to first merged PR | < 30 min from install | Funnel analytics |
| Skill usage (at least 1/session) | > 60% of sessions | Event: `skill_invoked` |

### Business Health (v1.1, 12 months post-launch)

| Metric | Target |
|---|---|
| Paying users (Pro + Team) | 500 |
| Enterprise trials | 5 |
| MRR | $15,000 |
| Churn (monthly) | < 5% |

### Leading Indicators (Week 1 Alpha)

- Zero crashes in a 3-workspace session running 30 minutes
- Setup script works for Next.js, Django, Rails, Laravel without manual intervention
- Diff viewer opens files up to 5,000 lines in < 200ms
- Workspace switch latency < 50ms with 5 active workspaces

---

## 16. Open Questions

1. **Bundled vs PATH binaries.** Bundle Claude Code and Codex for guaranteed compatibility, or resolve from `$PATH` for user-controlled upgrades? Current decision: bundle. Revisit when Codex releases frequent updates.

2. **ConPTY vs WSL on Windows.** ConPTY is native but limited for complex terminal apps. WSL is powerful but requires WSL2 installation. Current decision: ConPTY first; WSL opt-in experimental.

3. **SQLite WAL concurrent safety.** Confirm no corruption with 10 simultaneous agent writes and checkpoint commits. Needs stress testing with `cargo-test` load scenarios before v0.5.

4. **City name for workspaces vs numeric IDs.** City names are memorable but finite and culture-specific. Evaluate switching to a compound-word generator (like Docker container names) after city list is exhausted.

5. **Skill auto-invocation confidence threshold.** How confident must the context match be before auto-invoking a skill? Too low = annoying false activations. Too high = missed invocations. Default threshold needs empirical tuning in v0.5 beta.

6. **Data sync for Team plan.** Team dashboard requires sharing workspace status across machines. Options: peer-to-peer via relay (no server storage), or lightweight Operator cloud API (status only, no content). Architecture decision required before v1.1.

7. **OPERATOR.md vs CLAUDE.md vs AGENTS.md naming.** The auto-sync approach works but creates three near-identical files in every repo. Is this confusing to developers who don't use Operator? Consider auto-generating `.gitignore` entries for the aliases.

---

## Appendix A: Environment Variables

Operator injects both `OPERATOR_*` (primary) and `CONDUCTOR_*` (compatibility) into every agent process.

| Variable | Description |
|---|---|
| `OPERATOR_WORKSPACE_NAME` | City name of the current workspace |
| `OPERATOR_WORKSPACE_PATH` | Absolute path to the worktree directory |
| `OPERATOR_ROOT_PATH` | Absolute path to the repository root |
| `OPERATOR_DEFAULT_BRANCH` | Name of the repo's default branch |
| `OPERATOR_PORT` | First of 10 allocated ports for this workspace |
| `OPERATOR_REPO_NAME` | Repository name (slug format) |
| `OPERATOR_AGENT_BACKEND` | Active backend: `claude` \| `codex` \| `gemini` |
| `OPERATOR_TEAM_ID` | Team identifier (Team/Enterprise plan only) |
| `CONDUCTOR_WORKSPACE_NAME` | Alias: same value as `OPERATOR_WORKSPACE_NAME` |
| `CONDUCTOR_WORKSPACE_PATH` | Alias: same value as `OPERATOR_WORKSPACE_PATH` |
| `CONDUCTOR_ROOT_PATH` | Alias: same value as `OPERATOR_ROOT_PATH` |
| `CONDUCTOR_DEFAULT_BRANCH` | Alias: same value as `OPERATOR_DEFAULT_BRANCH` |
| `CONDUCTOR_PORT` | Alias: same value as `OPERATOR_PORT` |

---

## Appendix B: operator.json Schema

```jsonc
{
  // Scripts (Conductor-compatible)
  "scripts": {
    "setup": "npm install && cp $OPERATOR_ROOT_PATH/.env .env",
    "run": "npm run dev --port $OPERATOR_PORT",
    "archive": ""
  },
  "runScriptMode": "concurrent",  // "concurrent" | "nonconcurrent"
  "enterpriseDataPrivacy": false,

  // Agent configuration
  "agents": {
    "defaultBackend": "claude",           // "claude" | "codex" | "gemini"
    "allowedBackends": ["claude", "codex"],
    "teamsEnabled": false,                // Enable Agent Teams (experimental)
    "defaultModel": "claude-sonnet-4-6"
  },

  // Provider routing
  "providers": {
    "baseUrl": "",                        // e.g. "https://openrouter.ai/api"
    "authToken": ""                       // stored separately in keychain; reference only
  },

  // Git settings
  "git": {
    "defaultBranch": "main"
  },

  // Team cost control
  "team": {
    "costLimitPerWorkspace": 5.00         // USD; 0 = unlimited
  },

  // Skill configuration
  "skills": {
    "enabled": [],                        // [] = all enabled
    "disabled": ["write-docs"],           // disable specific skills
    "autoInvoke": true                    // allow skills to auto-activate
  },

  // Instruction file settings
  "instructions": {
    "template": "nextjs",                 // pre-fill from template on repo add
    "syncFormats": true                   // auto-sync to CLAUDE.md + AGENTS.md
  },

  // Pre-built hooks to enable
  "hooks": {
    "presets": [
      "auto-format-python",
      "desktop-notification",
      "sprint-context-inject"
    ]
  },

  // Automatic context injection
  "context": {
    "injectGitStatus": true,
    "injectTodos": true,
    "injectSprintContext": false,         // requires Linear/Jira MCP
    "injectEnvironmentSummary": true
  },

  // Attachment permissions
  "attachments": {
    "allowImages": true,
    "allowFiles": ["*"]                   // file extension allowlist; ["*"] = all
  }
}
```

---

## Appendix C: Built-in Skill Catalogue

All 40 skills ship with Operator and follow the Agent Skills Open Standard. Compatible with Claude Code and Codex without modification.

### Code Quality (5 skills)

| Name | Command | Auto-trigger |
|---|---|---|
| Code Review | `/code-review` | Review request, PR mention |
| Refactor | `/refactor` | Clean up, simplify, restructure |
| Explain Code | `/explain-code` | "How does X work", "explain" |
| Optimize Performance | `/optimize-perf` | Slow, performance, bottleneck |
| Naming Conventions | `/naming` | Variable/function naming questions |

### Testing (5 skills)

| Name | Command | Auto-trigger |
|---|---|---|
| Write Tests | `/write-tests` | Add tests, increase coverage |
| TDD Cycle | `/tdd-cycle` | TDD, test-first |
| E2E Tests | `/e2e-tests` | End-to-end, Playwright, Cypress |
| Test Fixtures | `/test-fixtures` | Test data, mocks, factories |
| Coverage Report | `/coverage-report` | Coverage gaps, missing tests |

### Documentation (5 skills)

| Name | Command | Auto-trigger |
|---|---|---|
| Write Docs | `/write-docs` | Document function, module |
| README | `/readme` | Update or generate README |
| Changelog | `/changelog` | Release notes, CHANGELOG |
| Architecture Doc | `/architecture-doc` | Document architecture, system design |
| API Docs | `/api-docs` | OpenAPI, API reference |

### Security (4 skills)

| Name | Command | Auto-trigger |
|---|---|---|
| Security Audit | `/security-audit` | Security review, OWASP, vulnerabilities |
| Secrets Scan | `/secrets-scan` | Credentials, API keys, .env |
| Dependency Audit | `/dep-audit` | CVEs, vulnerable deps, npm audit |
| Auth Review | `/auth-review` | Auth, JWT, OAuth, sessions |

### Git & PR (5 skills)

| Name | Command | Auto-trigger |
|---|---|---|
| Create PR | `/create-pr` | Open PR, push changes |
| PR Description | `/pr-description` | Write PR description |
| Commit Message | `/commit-msg` | Commit, conventional commit |
| Catchup | `/catchup` | What changed, context on branch |
| Resolve Conflict | `/resolve-conflict` | Merge conflict, rebase |

### Architecture (4 skills)

| Name | Command | Auto-trigger |
|---|---|---|
| Design System | `/design-system` | System design, architecture |
| Deep Research | `/deep-research` | Research topic, technology |
| Dependency Map | `/dependency-map` | Dependencies, module graph |
| Tech Debt | `/tech-debt` | Tech debt, cleanup |

### DevOps & CI (4 skills)

| Name | Command | Auto-trigger |
|---|---|---|
| CI Config | `/ci-config` | GitHub Actions, CI, pipelines |
| Docker | `/docker` | Docker, containers, Dockerfile |
| Env Setup | `/env-setup` | Environment setup, .env |
| Deploy Check | `/deploy-check` | Before deploy, merge to main |

### Framework-Specific (8 skills)

| Name | Command | Framework |
|---|---|---|
| Next.js Component | `/nextjs-component` | Next.js |
| Drupal Module | `/drupal-module` | Drupal |
| Laravel Feature | `/laravel-feature` | Laravel |
| Rails Scaffold | `/rails-scaffold` | Ruby on Rails |
| Django App | `/django-app` | Django |
| React Native Screen | `/rn-screen` | React Native |
| Elixir GenServer | `/genserver` | Elixir/Phoenix |
| FastAPI Endpoint | `/fastapi-endpoint` | FastAPI (Python) |

---

*End of OPERATOR.md*

*This document is the single source of truth for Operator's product requirements and functional specification. All engineering decisions should trace back to a requirement here. If a decision cannot be traced, raise it in the Open Questions section.*

*Last updated: March 2026 · Maintained by: Malhar Ujawane, AI Solutions and Delivery Lead, Mobiiworld FZ LLC*
