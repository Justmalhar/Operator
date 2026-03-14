# Operator — Settings Specification

*Version 1.0 · March 2026*

---

## 1. Settings Architecture

Settings live in two places:
- **App settings:** `~/Library/Application Support/com.operator.app/settings.json` (Tauri plugin-store)
- **Repo settings:** `operator.json` in each repository root (committed to git)

App settings are managed via the Settings panel. Repo settings are managed via the operator.json editor or committed directly.

---

## 2. App Settings Schema

```typescript
interface AppSettings {
  // Appearance
  theme: 'dark' | 'light' | 'system';
  fontSizeTerminal: number;       // 12–18, default 13
  fontSizeEditor: number;         // 12–18, default 13
  fontMonospace: string;          // default 'Cascadia Code'
  sidebarWidth: number;           // px, default 240

  // Agent defaults
  defaultBackend: 'claude' | 'codex' | 'gemini';
  defaultModel: string;
  defaultReasoningLevel: 'fast' | 'medium' | 'high' | 'max';
  defaultPermissionMode: 'readonly' | 'ask' | 'full';
  defaultExecutionMode: 'local' | 'cloud';

  // Port allocation
  basePort: number;               // default 3000

  // Git
  autoStageOnSetup: boolean;      // default true
  gitUserName: string;            // for checkpoint commits
  gitUserEmail: string;

  // IDE
  defaultIde: 'cursor' | 'vscode' | 'xcode' | 'auto';

  // Privacy & analytics
  analyticsEnabled: boolean;      // default true
  crashReportingEnabled: boolean; // default false
  logRetentionDays: number;       // 7, 14, 30, 90

  // Notifications
  desktopNotifications: boolean;
  notifyOnTaskComplete: boolean;
  notifyOnPermissionRequest: boolean;
  notifyOnError: boolean;
  notificationSound: boolean;

  // Advanced
  checkpointRetentionDays: number;  // default 30
  maxParallelWorkspaces: number;    // default 10
  debugMode: boolean;
  bundledClaudeCodePath: string;    // auto-detected, overridable
  bundledCodexPath: string;
  updateChannel: 'stable' | 'beta' | 'nightly';
  autoUpdate: boolean;              // default true
}
```

---

## 3. Settings Panels

### 3.1 General

```
┌──────────────────────────────────────────────────────────┐
│  General                                                 │
│  ────────────────────────────────────────────────────    │
│  Theme           [Dark ⌄]                                │
│  Terminal font   [Cascadia Code ⌄]  Size [13 ▲▼]        │
│  Editor font     [Cascadia Code ⌄]  Size [13 ▲▼]        │
│  Default IDE     [Cursor ⌄]                              │
│  Base port       [3000     ]                             │
│                                                          │
│  Startup                                                 │
│  ────────────────────────────────────────────────────    │
│  ☑ Check for updates on launch                          │
│  Update channel  [Stable ⌄]                             │
│  ☑ Restore last workspace on launch                     │
└──────────────────────────────────────────────────────────┘
```

### 3.2 Agent Backends

```
┌──────────────────────────────────────────────────────────┐
│  Agent Backends                                          │
│  ────────────────────────────────────────────────────    │
│  Claude Code (Anthropic)                                 │
│  Status: ● Connected as malhar@mobiiworld.com (Pro)     │
│  [Disconnect]                                            │
│                                                          │
│  Default model:       [Claude Sonnet 4.6 ⌄]            │
│  Reasoning:           [Medium ⌄]                        │
│  Extended context:    ☐ Use Opus 4.6 1M for long tasks  │
│                                                          │
│  ────────────────────────────────────────────────────    │
│  OpenAI Codex                                            │
│  Status: ○ Not connected                                 │
│  [Connect with ChatGPT account]  or  [API key ___]      │
│                                                          │
│  ────────────────────────────────────────────────────    │
│  Custom provider (OpenRouter / Bedrock / Vertex)         │
│  ☐ Enable custom provider                               │
│  Base URL:        [https://openrouter.ai/api        ]   │
│  Auth token:      [●●●●●●●●●●  ✎]                      │
│  API key (empty): [                                 ]    │
│  ⚠ Set API key to empty string for Anthropic-compat     │
└──────────────────────────────────────────────────────────┘
```

### 3.3 Hooks

```
┌──────────────────────────────────────────────────────────┐
│  Hooks  [Global settings — applies to all repos]         │
│  ────────────────────────────────────────────────────    │
│  Pre-built hook library                                   │
│                                                          │
│  ☑ Desktop notifications (Notification events)          │
│    → macOS/Windows/Linux alert when agent needs input    │
│                                                          │
│  ☐ Auto-format Python after write                       │
│    → Requires: black                                     │
│                                                          │
│  ☐ Auto-format JS/TS after write                        │
│    → Requires: prettier                                  │
│                                                          │
│  ☐ Block rm -rf commands                                │
│    → Prompt user before allowing dangerous deletes       │
│                                                          │
│  ☐ Run tests on agent stop                              │
│    → Blocks agent from finishing until tests pass        │
│                                                          │
│  ────────────────────────────────────────────────────    │
│  Custom global hooks    [+ Add hook]                     │
│  (empty)                                                 │
└──────────────────────────────────────────────────────────┘
```

### 3.4 Privacy

```
┌──────────────────────────────────────────────────────────┐
│  Privacy                                                 │
│  ────────────────────────────────────────────────────    │
│  Data storage                                            │
│  All chat history and code stays on your Mac.           │
│  Nothing is stored on Operator's servers.               │
│  Location: ~/Library/Application Support/com.operator.app│
│  [Open in Finder]                                        │
│                                                          │
│  Analytics                                               │
│  ☑ Send anonymous usage analytics (PostHog)             │
│    We track feature usage, not code or content.          │
│    [View what's collected]                               │
│                                                          │
│  ☐ Send crash reports (Sentry)                         │
│    Includes stack traces + last 10 operation names.      │
│    No code, no messages, no file contents.               │
│                                                          │
│  Log retention     [7 days ⌄]                           │
│  Checkpoint retention [30 days ⌄]                       │
│                                                          │
│  [Delete all local data...]                              │
└──────────────────────────────────────────────────────────┘
```

### 3.5 Repositories

```
┌──────────────────────────────────────────────────────────┐
│  Repositories                                            │
│  ────────────────────────────────────────────────────    │
│  Justmalhar/mobiiworld-skills-lib                        │
│    Path: ~/code/mobiiworld-skills-lib                   │
│    Platform: GitHub  Branch: main                        │
│    Workspaces: 3 active, 12 archived                     │
│    [Open settings] [Remove]                              │
│                                                          │
│  Justmalhar/mobii-ai                                     │
│    Path: ~/code/mobii-ai                                │
│    Platform: GitHub  Branch: main                        │
│    Workspaces: 2 active, 8 archived                      │
│    [Open settings] [Remove]                              │
│                                                          │
│  [+ Add repository]                                      │
└──────────────────────────────────────────────────────────┘
```

Per-repository settings (click "Open settings"):
- Scripts (setup, run, archive)
- operator.json editor
- Installed skills
- Hooks
- Preferences (branch naming, auto-commit, etc.)

### 3.6 Keyboard Shortcuts

```
┌──────────────────────────────────────────────────────────┐
│  Keyboard Shortcuts                                      │
│  ────────────────────────────────────────────────────    │
│  New workspace            ⌘N         [edit]             │
│  New workspace (options)  ⌘⇧N        [edit]             │
│  Command palette          ⌘K         [edit]             │
│  Diff viewer              ⌘D         [edit]             │
│  Open in IDE              ⌘O         [edit]             │
│  Settings                 ⌘,         [edit]             │
│  Stop agent               ⌘⇧⌫        [edit]             │
│  Background agent         Ctrl+B     [edit]             │
│                                                          │
│  [Reset to defaults]                                     │
└──────────────────────────────────────────────────────────┘
```

### 3.7 Advanced

```
┌──────────────────────────────────────────────────────────┐
│  Advanced                                                │
│  ────────────────────────────────────────────────────    │
│  Max parallel workspaces    [10    ▲▼]                   │
│  Checkpoint retention       [30 days ⌄]                 │
│  Git identity for commits                                │
│    Name:  [Operator Agent          ]                     │
│    Email: [operator@local          ]                     │
│                                                          │
│  Agent binaries                                          │
│  Claude Code: [Auto-detect ⌄]  [/opt/.../claude-code]   │
│  Codex:       [Auto-detect ⌄]  [/opt/.../codex]         │
│                                                          │
│  ☐ Debug mode (verbose logging + dev tools)             │
│                                                          │
│  Experimental features                                   │
│  ☐ Agent Teams (Claude Code Feb 2026)                   │
│  ☐ Spotlight testing                                    │
│  ☐ Cloud-executed agents (Codex Cloud)                  │
│                                                          │
│  Migration                                               │
│  [Import from Conductor]  [Export all settings]         │
│                                                          │
│  [View logs]  [Open app data folder]                    │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Env Vars Panel

Accessible from Settings → Env Vars, or via workspace right-click → "Edit env vars".

```
┌──────────────────────────────────────────────────────────┐
│  Environment Variables  ·  Global                        │
│  ────────────────────────────────────────────────────    │
│  These are injected into all agent processes.            │
│  To override per-workspace: use workspace env vars.      │
│  Secret values are stored in the OS keychain.           │
│                                                          │
│  Key                    Value                 [Secret]   │
│  ──────────────────────────────────────────────────────  │
│  ANTHROPIC_BASE_URL     https://openrouter... ☐          │
│  ANTHROPIC_AUTH_TOKEN   ●●●●●●●●●●            ☑          │
│  ANTHROPIC_API_KEY      (empty string)        ☐          │
│                                              [+ Add var] │
│                                                          │
│  Provider examples                                       │
│  [OpenRouter]  [AWS Bedrock]  [Vertex AI]  [Azure AI]   │
└──────────────────────────────────────────────────────────┘
```

Clicking a provider example pre-fills the correct env var names and shows the documentation inline.

---

## 5. Per-Repo operator.json Settings

When a repo is selected in Repositories panel → "Open settings":

```
┌────────────────────────────────────────────────────────────┐
│  mobiiworld-skills-lib  ·  Repository Settings             │
├──────────────────────────────────────────────────────────  │
│  Scripts          Instructions   Skills   Hooks   Prefs    │
│                                                            │
│  [Scripts tab]                                             │
│  Setup script:                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  # Setup                                           │   │
│  │  npm install                                       │   │
│  │  ln -s "$OPERATOR_ROOT_PATH/.env" .env             │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Run script:                                               │
│  ┌────────────────────────────────────────────────────┐   │
│  │  npm run dev --port $OPERATOR_PORT                 │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  Run script mode:  ● Concurrent  ○ Nonconcurrent           │
│                                                            │
│  Archive script:                                           │
│  ┌────────────────────────────────────────────────────┐   │
│  │  (empty)                                           │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  [Share with team → commit as operator.json]              │
└────────────────────────────────────────────────────────────┘
```
