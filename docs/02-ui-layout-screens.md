# Operator — UI Layout & Screens

*Version 1.0 · March 2026 · Referenced UIs: Codex App, Conductor, Google Antigravity*

---

## 1. Design Principles

Derived from studying all three reference UIs:

| Principle | Source Inspiration | Implementation |
|---|---|---|
| **Dark-first** | Codex app, Conductor | Dark theme default; light theme toggle in Settings |
| **Sidebar + main pane** | All three | Left sidebar (240px), main workspace area, optional right panel |
| **Repo-grouped threads** | Codex sidebar | Workspaces grouped by repository |
| **Persistent model indicator** | Codex bottom bar | Model + reasoning level always visible in status bar |
| **Top-bar cost indicator** | Conductor ($23.46 in top bar) | Running token cost visible at workspace level |
| **Split right panel** | Conductor (Changes / Checks / All files) | Tabbed right panel: Files / Changes / Checks |
| **Inline terminal** | Conductor | Terminal tab in bottom panel |
| **Code view alongside chat** | Antigravity | Optional code panel right of chat (split layout) |
| **Image attachment in composer** | Codex + Antigravity | + button opens file picker; paste from clipboard |
| **Voice input** | Codex + Antigravity | Mic button in composer |

---

## 2. Global Layout

```
┌────────────────────────────────────────────────────────────────────┐
│ Title Bar: [Traffic lights] [Back/Fwd] [Repo > Branch] [Open] [Cost] │
├──────────────┬────────────────────────────────────┬────────────────┤
│              │                                    │                │
│  Left        │        Main Area                   │  Right Panel   │
│  Sidebar     │  (Workspace Chat / Empty State)    │  (optional)    │
│  (240px)     │                                    │  All Files /   │
│              │                                    │  Changes /     │
│  Workspaces  │                                    │  Checks        │
│  Repos       │                                    │                │
│  Skills      │                                    │  (720px min)   │
│  Knowledge   │                                    │                │
│              ├────────────────────────────────────┤                │
│  ─────────── │        Bottom Panel                │                │
│  Settings    │  [Setup] [Run] [Terminal] [+]      │                │
│  Feedback    │                                    │                │
└──────────────┴────────────────────────────────────┴────────────────┘
```

**Resizable panels:** Left sidebar (min 180px, max 320px), Right panel (collapsible, min 280px), Bottom panel (collapsible, min 120px, max 50% height).

---

## 3. Screens

---

### 3.1 Empty State / New Thread

**Triggered:** When no workspace is selected, or after creating a new thread.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                        ⚙  (operator logo)                   │
│                                                             │
│                       Let's build                           │
│                    mobii-forms  ⌄                           │
│                                                             │
│   ┌─────────────────┐  ┌─────────────────┐  ┌───────────┐  │
│   │ 🎮 Build a Snake│  │ 📄 Summarize    │  │ ✏ Create  │  │
│   │ game in repo    │  │ this app as PDF │  │ a plan to │  │
│   └─────────────────┘  └─────────────────┘  └───────────┘  │
│                      Explore more →                         │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  Ask Operator anything, @ to add files, / for cmds │   │
│   │                                                     │   │
│   │  + │ GPT-5.4 ⌄ │ Medium ⌄ │         🎤  ──►        │   │
│   └─────────────────────────────────────────────────────┘   │
│    Local ⌄   Full access ⌄ ─────────────────  ⎇ main ⌄     │
└─────────────────────────────────────────────────────────────┘
```

**Elements:**
- Repo selector (dropdown, shows current repo name from sidebar selection)
- 3 suggestion cards (context-aware prompts based on repo type)
- "Explore more" link → expands suggestion grid
- Composer (see Section 4)
- Status bar (bottom)

---

### 3.2 Workspace Chat View (Primary Screen)

**Triggered:** Workspace selected from sidebar.

```
┌─────────────────────────────────────────────────────────────────┐
│  ◄  Justmalhar/mobiiworld-skills-lib  > origin/main  > /mobii   │
│  [Build AI Skills…] [SKILL.md] [+]      [Open ⌄] [Commit] [Cost]│
├──────────────┬──────────────────────────────┬───────────────────┤
│ Workspaces   │  SKILL.md                    │  All Files Changes│
│              │  Build AI Skills ...         │  Checks           │
│ mw-academy   │  ┌──────────────────────┐   ├───────────────────┤
│ mobii-forms  │  │ Agent message        │   │ ▸ src/            │
│ ▸ Justmalhar │  │ Done. Here's what    │   │   ▸ components/   │
│   /mobii     │  │ was set up:          │   │   ▸ pages/        │
│    ● tokyo   │  │                      │   │ ▸ assets/         │
│    ● berlin  │  │  • CLAUDE.md +12     │   │ ▸ .operator/      │
│   /dev       │  │  • SKILL.md +6       │   │   CLAUDE.md       │
│    ○ cairo   │  └──────────────────────┘   │   operator.json   │
│              │                             │                   │
│ ─────────    │  1m 24s · 7 tool calls      │                   │
│ Skills       │  [CLAUDE.md +12] [SKILL.md] │                   │
│ Automations  │                             │                   │
│ Knowledge    │  ┌──────────────────┐       │                   │
│              │  │ User message     │       │                   │
│ ─────────    │  │ the asset should │       │                   │
│ Settings     │  │ be within each   │       │                   │
│ Feedback     │  │ skill            │       │                   │
│              │  └──────────────────┘       │                   │
│              ├──────────────────────────── ┤                   │
│              │  Ask to make changes...     │                   │
│              │  + │ ✦ Sonnet 4.6 │Thinking│                   │
│              ├─────────────────────────────┴───────────────────┤
│              │  Setup │ Run │ Terminal │ +                     │
│              │  > ls                                           │
│              │  CLAUDE.md  skills                              │
└──────────────┴─────────────────────────────────────────────────┘
```

**Key elements:**
- Tabbed workspace switcher (top, per open workspace)
- Active tab shows workspace name + file breadcrumb
- Cost indicator top-right per workspace
- Chat messages with tool-call expansion (▸ 7 tool calls)
- File change badges inline in messages: `[CLAUDE.md +12 -0]`
- Right panel: All Files / Changes / Checks tabs
- Bottom panel: Setup / Run / Terminal tabs
- Status indicators: ● (running), ○ (idle), ✓ (done), ! (needs review)

---

### 3.3 Diff Viewer Screen

**Triggered:** Click on file change badge in chat, or ⌘D, or "Changes" tab in right panel.

```
┌──────────────────────────────────────────────────────────────────┐
│  ← Back  │  CLAUDE.md   +12 -0    │  [Viewed ☐]  [Comment ✎]   │
├──────────────────────────────────────────────────────────────────┤
│  File tree        │         Diff                                 │
│  ──────────       │  ─────────────────────────────────────────   │
│  ▸ CLAUDE.md      │   @@ -1,4 +1,16 @@                          │
│    SKILL.md       │   + ## Shared Assets                         │
│    README.md      │   + Always use assets/mobiiworld-logo.png    │
│                   │   + when a logo placeholder appears.         │
│                   │   +                                          │
│                   │   @@ -20,0 +32,8 @@                         │
│                   │   + ## Working Agreements                    │
│                   │   + - Always run npm test after modifying    │
│                   │     JS files.                                │
│                   │                                              │
│                   │   ┌────────────────────────────────┐         │
│                   │   │ + Add a comment...             │         │
│                   │   └────────────────────────────────┘         │
├──────────────────────────────────────────────────────────────────┤
│   [← Prev file]   [Next file →]   [Create PR]   [Discard changes]│
└──────────────────────────────────────────────────────────────────┘
```

**Features:**
- Side-by-side or unified diff toggle
- Inline commenting (drag to select range → comment box appears)
- "Viewed" checkbox per file (tracks review progress)
- Syntax highlighting via CodeMirror language packs
- Keyboard navigation: `[` / `]` prev/next file, `n` / `p` prev/next hunk

---

### 3.4 Skill Library Panel

**Triggered:** Click "Skills" in left sidebar, or `/skills` command.

```
┌────────────────────────────────────────────────────────────┐
│  Skills Library                    [+ New Skill]  [Search] │
├────────────────────────────────────────────────────────────┤
│  Categories         │  Skills                  │ Preview   │
│  ─────────────      │  ─────────────────────   │ ────────  │
│  ● All (40)         │  /code-review             │ ---       │
│  ○ Code Quality (5) │  Auto-invokes: review...  │ name:     │
│  ○ Testing (5)      │  [Repo] [Installed]       │ code-     │
│  ○ Documentation(5) │                           │ review    │
│  ○ Security (4)     │  /write-tests             │           │
│  ○ Git & PR (5)     │  Auto-invokes: add tests  │ desc:     │
│  ○ Architecture (4) │  [Repo]                   │ Trigger   │
│  ○ DevOps (4)       │                           │ when user │
│  ○ Frameworks (8)   │  /security-audit          │ asks for  │
│                     │  Auto-invokes: security   │ review... │
│                     │  [Global] [Installed]     │           │
│                     │                           │ ---       │
│                     │  /drupal-module            │ allowed-  │
│                     │  Framework: Drupal         │ tools:    │
│                     │  [Repo]                    │ Read,     │
│                     │                           │ Grep,     │
│                     │  /laravel-feature          │ Glob      │
│                     │  Framework: Laravel        │           │
│                     │  [Repo]                    │ [Install] │
└────────────────────────────────────────────────────────────┘
```

**Skill install locations:**
- `[Global]` → installs to `~/.operator/skills/`
- `[Repo]` → installs to `.operator/skills/` in current repo
- Badge shows: `Installed` (green), `Available` (outline), `Custom` (amber)

---

### 3.5 Settings Screen

**Triggered:** Click "Settings" in sidebar, or ⌘,

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                                │
├────────────┬─────────────────────────────────────────────┤
│  General   │  Agent Backends                             │
│  Backends  │  ─────────────────────────────────────────  │
│  Models    │  Claude Code                                │
│  Privacy   │    Auth: ● Claude Pro (logged in)           │
│  Hooks     │    Model: Sonnet 4.6 ⌄                     │
│  Env Vars  │    Alt models: [Opus 4.6 1M] toggle         │
│  Shortcuts │                                             │
│  Repos     │  Codex (OpenAI)                             │
│  Team      │    Auth: ○ Not connected  [Connect]         │
│  Advanced  │    Model: GPT-5.4 ⌄                        │
│            │                                             │
│            │  Gemini CLI                                 │
│            │    Auth: ○ Not connected  [Connect]         │
│            │    Status: [Coming soon]                    │
│            │                                             │
│            │  Custom provider (OpenRouter / Bedrock)     │
│            │    Base URL: _______________________        │
│            │    Auth token: ●●●●●●●●●●  [Edit]          │
└────────────┴─────────────────────────────────────────────┘
```

---

### 3.6 Hooks Configurator

**Triggered:** `/hooks`, or Settings → Hooks tab.

```
┌────────────────────────────────────────────────────────────┐
│  Hooks  ·  mobiiworld-skills-lib          [+ New Hook]     │
├───────────────────────────────────────────────────────────┤
│  Pre-built library                                         │
│  ─────────────────────────────────────────────────────    │
│  ☑ Auto-Format Python     PostToolUse · Write(*.py)       │
│  ☑ Block Dangerous Rm     PreToolUse · Bash               │
│  ☐ Security Guard         PreToolUse · Edit (LLM eval)    │
│  ☐ Desktop Notification   Notification · permission_prompt│
│  ☑ Sprint Context Inject  SessionStart                    │
│                                                            │
│  Custom hooks                                              │
│  ─────────────────────────────────────────────────────    │
│  ┌─────────────────────────────────────────────────────┐  │
│  │  Event:  [PreToolUse          ⌄]                    │  │
│  │  Match:  [Write(*.ts)              ]                │  │
│  │  Type:   ● Command  ○ LLM Prompt  ○ Subagent        │  │
│  │  Cmd:    [npx prettier --write $OPERATOR_FILE     ] │  │
│  │                              [Test Hook]  [Save]    │  │
│  └─────────────────────────────────────────────────────┘  │
│  settings.json preview  ▸                                  │
└────────────────────────────────────────────────────────────┘
```

---

### 3.7 OPERATOR.md / Instruction Editor

**Triggered:** Click instruction file indicator in status bar, or `operator.md` in file tree.

```
┌────────────────────────────────────────────────────────────────┐
│  Instructions  ·  mobiiworld-skills-lib                        │
├──────────────────────────────────────────────────────────────  │
│  [Global]  [Repo Root]  [src/]  [Overrides]                    │
├──────────────────────────────────────────────────────────────  │
│  Editor                          │  Combined preview           │
│  ─────────────────────────────   │  ─────────────────────────  │
│  # OPERATOR.md — mobii skills    │  (What Claude/Codex sees)   │
│                                  │                             │
│  ## Stack                        │  [Global instructions...]   │
│  - Next.js 14, TypeScript        │                             │
│  - Tailwind CSS v4               │  [Repo instructions...]     │
│  - Vitest for testing            │                             │
│  - pnpm as package manager       │  Budget: 8.2 / 32 KiB ████  │
│                                  │  ⚠ Conflict: npm vs pnpm   │
│  ## PR Checklist                 │                             │
│  - [ ] Tests pass                │  [Save]  [Export CLAUDE.md] │
│  - [ ] Lint passes               │  [Export AGENTS.md]         │
│  - [ ] No hardcoded secrets      │                             │
└──────────────────────────────────┴─────────────────────────────┘
```

---

### 3.8 Agent Teams Topology View

**Triggered:** `/team`, or Settings → Advanced → Agent Teams.

```
┌──────────────────────────────────────────────────────────────┐
│  Agent Teams  ·  tokyo workspace          [+ Add Agent] [Run]│
├──────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐                                           │
│   │  🧠 Planner  │ ────────────────────┐                   │
│   │  Claude      │                     ▼                   │
│   │  Opus 4.6   │            ┌─────────────────┐           │
│   └─────────────┘            │  💻 Frontend Dev │           │
│          │                   │  Claude Sonnet   │           │
│          │                   └─────────────────┘           │
│          ▼                                                  │
│   ┌─────────────┐            ┌─────────────────┐           │
│   │  🔧 Backend  │◄──────────│  🧪 QA Reviewer  │           │
│   │  Claude      │           │  Codex           │           │
│   │  Sonnet 4.6 │           └─────────────────┘           │
│   └─────────────┘                                           │
│                                                              │
│  Templates: [Frontend+Backend+QA] [Planner+Coder+Critic]    │
│  Est. cost for this task: ~$0.45          [Save topology]   │
└──────────────────────────────────────────────────────────────┘
```

---

### 3.9 Automations Screen

**Triggered:** Click "Automations" in sidebar (mirrors Codex "Automations").

Automations = saved sequences of prompts + hooks that run on a trigger (schedule, PR event, git hook).

```
┌──────────────────────────────────────────────────────────────┐
│  Automations                               [+ New Automation]│
├──────────────────────────────────────────────────────────────┤
│  Name                │  Trigger        │  Status  │  Last run│
│  ─────────────────   │  ─────────────  │  ──────  │  ──────  │
│  Daily PR review     │  Schedule: 9am  │  ● Active│  2h ago  │
│  Pre-commit lint     │  git pre-commit │  ● Active│  5m ago  │
│  Deploy checklist    │  Manual         │  ○ Paused│  3d ago  │
│  Security scan       │  PR opened      │  ● Active│  1h ago  │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Composer Component (Shared)

The composer appears at the bottom of every workspace chat pane.

```
┌──────────────────────────────────────────────────────────────────┐
│  [Image thumbnail ✕] [file.tsx ✕]              (attachments row) │
│                                                                  │
│  Ask to make changes, @mention files, /run commands              │
│  (auto-expanding textarea, max 8 lines before scroll)            │
│                                                                  │
├──────────────────────────────────────────────────────────────────┤
│  [+]  [✦ Sonnet 4.6 ⌄]  [Thinking ⌄]          [🎤]  [──►]      │
└──────────────────────────────────────────────────────────────────┘
```

**Composer elements:**
- `+` → opens attachment picker (images, files, screenshots)
- Model picker → shows available models for active backend
- Reasoning level → (Fast / Medium / High / Max) for Claude; (Low/Med/High) for Codex
- Attachment row → shows thumbnails of attached files/images, each removable
- `@` trigger → fuzzy file search overlay (see Section 5)
- `/` trigger → slash command palette overlay (see Section 6)
- `!` prefix → shell command injection (output appended to message)
- Mic → voice input (Web Speech API)
- Send button (→) or Enter; Shift+Enter for newline

**Status bar (below composer):**
```
│  Local ⌄   Full access ⌄ ────────────────────────── ⎇ main ⌄  │
```
- `Local` → execution mode (Local vs Codex Cloud)
- `Full access` → permission level (read-only / ask / full)
- Branch indicator (rightmost)

---

## 5. @ File Mention Overlay

Appears when user types `@` in composer. Fuzzy searches workspace file tree.

```
┌────────────────────────────────────────┐
│  @  src/components/                    │
│  ─────────────────────────────────────  │
│  ► src/components/DashboardLayout.tsx  │
│    src/components/Sidebar.tsx          │
│    src/components/SearchBar.tsx        │
│    src/pages/index.tsx                 │
│    CLAUDE.md                           │
└────────────────────────────────────────┘
```

- Powered by `fuse.js` over workspace file index
- File index refreshed via `notify` watcher on workspace directory
- Arrow keys + Enter to select; Esc to dismiss
- Multiple @ mentions per message supported

---

## 6. Slash Command Palette (⌘K)

Full-screen palette overlay. Mirrors Codex's `/` and Antigravity's `/workflows`.

```
┌────────────────────────────────────────────────────────────────┐
│  /  code-review                                       [ESC]    │
├────────────────────────────────────────────────────────────────┤
│  Categories        │  Commands                  │  Preview     │
│  ─────────────     │  ──────────────────────    │  ──────────  │
│  ★ Favorites       │  /code-review          ★   │  Trigger:    │
│  All               │  Code Quality · Auto      │  when asked  │
│  Code Quality      │                            │  to review   │
│  Testing           │  /create-pr            ★   │  code or PR  │
│  Documentation     │  Git & PR                  │              │
│  Security          │                            │  Tools:      │
│  Git & PR          │  /write-tests              │  Read, Grep, │
│  Architecture      │  Testing                   │  Glob        │
│  Frameworks        │                            │              │
│  Built-in          │  /clear                    │  Context:    │
│                    │  Built-in                  │  default     │
│                    │                            │              │
│                    │  /diff                     │  [Install]   │
│                    │  Built-in                  │  [Run now]   │
└────────────────────────────────────────────────────────────────┘
```

---

## 7. Workspace Sidebar Detail

Left sidebar item anatomy (workspace entry):

```
┌──────────────────────────────────────┐
│  ▸ Justmalhar/mobii-ai               │  ← repo group (collapsible)
│      ● tokyo       [needs review]    │  ← running workspace
│      ● berlin                        │  ← running workspace
│      ○ cairo       [idle]            │  ← idle workspace
│    + New workspace                   │
└──────────────────────────────────────┘
```

Status icons:
- `●` green pulse → agent actively running
- `●` amber → agent waiting for input / needs approval
- `●` red → agent errored
- `○` → idle / stopped
- `✓` → completed, ready to merge
- `⚠` → has unresolved todos

Workspace badge (right side):
- `[needs review]` → agent finished, diff waiting
- `[$0.12]` → session cost
- `[2 todos]` → blocked by todos

---

## 8. Keyboard Shortcuts Reference

| Shortcut | Action |
|---|---|
| `⌘N` | New workspace |
| `⌘⇧N` | New workspace (with options: branch/PR/issue) |
| `⌘K` | Open slash command palette |
| `⌘D` | Open diff viewer |
| `⌘O` | Open workspace in external IDE |
| `⌘T` | New tab in main area |
| `⌘W` | Close current tab |
| `⌘,` | Open Settings |
| `⌘F` | Search in terminal |
| `⌘⌥C` | Copy last agent message as markdown |
| `⌘⇧⌫` | Cancel/stop agent |
| `Ctrl+B` | Send agent to background |
| `[` / `]` | Previous / next file in diff |
| `n` / `p` | Previous / next hunk in diff |
| `1–9` | Switch active model (in model picker focus) |
