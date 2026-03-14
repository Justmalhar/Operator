# Operator — Component Design

*Version 1.0 · March 2026*

---

## 1. Component Tree Overview

```
<App>
├── <TitleBar />
├── <SidebarLayout>
│   ├── <WorkspaceList />
│   │   ├── <RepoGroup />
│   │   │   └── <WorkspaceItem />
│   └── <SidebarNav />  (Skills, Automations, Knowledge, Settings)
├── <MainArea>
│   ├── <WorkspaceTabs />
│   ├── <WorkspacePane>  (active workspace)
│   │   ├── <ChatPanel>
│   │   │   ├── <MessageList />
│   │   │   │   ├── <AgentMessage />
│   │   │   │   │   ├── <ToolCallExpander />
│   │   │   │   │   └── <FileChangeBadges />
│   │   │   │   └── <UserMessage />
│   │   │   └── <Composer />
│   │   │       ├── <AttachmentRow />
│   │   │       ├── <ComposerTextarea />
│   │   │       ├── <ModelPicker />
│   │   │       ├── <ReasoningPicker />
│   │   │       └── <StatusBar />
│   │   ├── <RightPanel>  (collapsible)
│   │   │   ├── <FileTree />
│   │   │   ├── <ChangesTab />
│   │   │   └── <ChecksTab />
│   │   └── <BottomPanel>  (collapsible)
│   │       ├── <SetupTab />
│   │       ├── <RunTab />
│   │       └── <TerminalTab />
│   └── <EmptyState />
├── <CommandPalette />  (global overlay, ⌘K)
├── <FileMentionOverlay />  (local to Composer)
└── <ToastContainer />
```

---

## 2. Component Specifications

---

### 2.1 `<WorkspaceItem />`

Represents a single workspace in the sidebar.

```typescript
interface WorkspaceItemProps {
  workspace: Workspace;
  isActive: boolean;
  onClick: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}

// Workspace status drives visual indicator
type WorkspaceStatus =
  | 'running'       // ● green pulse
  | 'waiting'       // ● amber pulse (agent needs input)
  | 'needs_review'  // ✓ blue (agent done, diff waiting)
  | 'idle'          // ○ grey
  | 'error'         // ● red
  | 'blocked'       // ⚠ amber (todos not cleared)
  | 'archived';     // dim text
```

Context menu items: Open in IDE, Rename, Archive, Delete, Fork session, Copy branch name.

---

### 2.2 `<ChatPanel />`

Container for all chat interaction. Manages scroll position, streaming state, and message history.

```typescript
interface ChatPanelProps {
  workspaceId: string;
}

// Internal state (Zustand slice)
interface ChatState {
  messages: Message[];
  isStreaming: boolean;
  pendingMessage: string | null;
  queuedMessages: string[];  // Codex-style message queue
  scrollPosition: number;
}
```

Streaming behavior:
- `agent_output` Tauri events append to current assistant message
- `\n---TURN_END---\n` sentinel signals turn completion
- Turn completion triggers checkpoint creation event

---

### 2.3 `<AgentMessage />`

Displays a single agent response with collapsible tool calls.

```typescript
interface AgentMessageProps {
  message: AssistantMessage;
  onRevert: (turnId: string) => void;  // checkpoint revert
  isLatest: boolean;
}

interface AssistantMessage {
  id: string;
  turnId: string;
  content: string;              // markdown
  toolCalls: ToolCall[];
  duration: number;             // ms
  tokenCount: number;
  cost: number;                 // USD
  fileChanges: FileChange[];    // for inline badges
  timestamp: string;
  model: string;
}
```

Revert button appears on hover over the message (right-aligned, subtle).

---

### 2.4 `<ToolCallExpander />`

Collapsible panel showing raw tool calls for transparency.

```typescript
interface ToolCallExpanderProps {
  toolCalls: ToolCall[];
  defaultExpanded?: boolean;
}

interface ToolCall {
  tool: string;         // 'Read' | 'Write' | 'Bash' | 'Edit' | ...
  input: unknown;
  output?: unknown;
  duration: number;
  status: 'success' | 'error' | 'blocked';
}
```

Collapsed: `▸ 7 tool calls  ⧉ ↺ 💾`  (icons: expand, copy, save to file)
Expanded: each tool call shows tool name, input, output, timing.

---

### 2.5 `<Composer />`

Primary text input for agent interaction. Most complex component.

```typescript
interface ComposerProps {
  workspaceId: string;
  onSend: (message: ComposerMessage) => void;
  onQueue: (message: string) => void;  // queue while agent running
  disabled?: boolean;
}

interface ComposerMessage {
  text: string;
  attachments: Attachment[];
  shellInjections: ShellInjection[];  // lines starting with !
}

interface Attachment {
  type: 'image' | 'file' | 'screenshot';
  name: string;
  mimeType: string;
  base64?: string;  // for images
  path?: string;    // for files (read at send time)
}

interface ShellInjection {
  command: string;
  output: string;   // resolved before send
}
```

**@ mention flow:**
1. User types `@`
2. `<FileMentionOverlay />` mounts, positioned below cursor
3. Fuse.js searches workspace file index
4. Selection inserts `@path/to/file.tsx` into textarea as styled token

**! injection flow:**
1. User types `!ls -la` on its own line
2. On send: Tauri `invoke("run_shell_command", { cmd: "ls -la", cwd: workspacePath })`
3. Output appended to message before sending to agent

---

### 2.6 `<ModelPicker />`

Dropdown for selecting agent backend + model.

```typescript
interface ModelPickerProps {
  workspaceId: string;
  currentModel: ModelConfig;
  onChange: (model: ModelConfig) => void;
}

interface ModelConfig {
  backend: 'claude' | 'codex' | 'gemini' | 'custom';
  model: string;    // e.g. 'claude-sonnet-4-6'
  reasoning: 'fast' | 'medium' | 'high' | 'max';
}
```

Groups models by backend. Shows cost indicator per model ($/1M tokens).

---

### 2.7 `<DiffViewer />`

Full-featured code diff viewer using CodeMirror.

```typescript
interface DiffViewerProps {
  workspaceId: string;
  filePath: string;
  diff: ParsedDiff;
  onComment: (range: LineRange, text: string) => void;
  onMarkViewed: (filePath: string) => void;
}

interface ParsedDiff {
  hunks: Hunk[];
  oldPath: string;
  newPath: string;
  stats: { additions: number; deletions: number };
}
```

Uses CodeMirror 6 `MergeView` extension for side-by-side diff. Language detection by file extension → appropriate CodeMirror language pack loaded dynamically.

Comment UI: Click-drag in gutter → comment thread appears inline.

---

### 2.8 `<FileTree />`

Virtualized file tree using `react-arborist`.

```typescript
interface FileTreeProps {
  workspaceId: string;
  changedFiles: string[];   // highlighted in amber
  onFileClick: (path: string) => void;
  onFileContextMenu: (path: string, e: React.MouseEvent) => void;
}
```

- Modified files show amber dot indicator
- Untracked files shown with `?` prefix (git status)
- Right-click context menu: Open in IDE, Copy path, View diff, Add to @mention

---

### 2.9 `<TerminalTab />`

xterm.js terminal instance, one per workspace.

```typescript
interface TerminalTabProps {
  workspaceId: string;
  terminalId: string;  // unique per terminal instance
}
```

Features:
- Full PTY — handles ANSI escape codes, colors, cursor movement
- WebGL renderer for 60fps output
- ⌘F search overlay (xterm search addon)
- Right-click → copy/paste
- Auto-resize on panel resize (fit addon)
- Multiple terminal sessions per workspace via `+` button in tab bar

---

### 2.10 `<CommandPalette />`

Global overlay, mounted at App root. Activated by ⌘K or `/` in composer.

```typescript
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  context: 'global' | 'composer';  // composer context = scoped to workspace
  onCommand: (command: Command) => void;
}

interface Command {
  id: string;
  name: string;          // display name
  description: string;
  category: CommandCategory;
  source: 'builtin' | 'skill' | 'custom' | 'plugin';
  acceptsArgs: boolean;
  shortcut?: string;
  skill?: Skill;         // if source === 'skill'
}
```

- Three-pane layout: categories | commands | preview
- Powered by `cmdk` for accessibility and keyboard nav
- Search is fuse.js over command name + description + category
- Argument input: if `acceptsArgs`, shows inline text field before dispatch
- Pinned commands persist via localStorage (pinned command IDs)

---

### 2.11 `<SkillPanel />`

Full-page panel for browsing and installing skills.

```typescript
interface SkillPanelProps {
  repoId: string | null;
}

interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  autoInvoke: boolean;
  allowedTools: string[];
  context: 'default' | 'fork';
  agent?: string;
  installScope: 'global' | 'repo' | 'not-installed';
  isBuiltIn: boolean;
  skillMdContent: string;
}
```

Three-pane: categories | skill list | SKILL.md preview.
Install action: Tauri `invoke("install_skill", { skillId, scope })`.

---

### 2.12 `<HooksConfigurator />`

Visual builder for lifecycle hooks. Writes to `settings.json`.

```typescript
interface HooksConfiguratorProps {
  repoId: string;
}

interface HookConfig {
  event: HookEvent;
  matcher?: string;     // e.g. "Write(*.py)"
  handlerType: 'command' | 'prompt' | 'agent';
  handler: string;      // shell cmd, prompt text, or agent name
  enabled: boolean;
  isPreset: boolean;
  presetId?: string;
}

type HookEvent =
  | 'UserPromptSubmit' | 'PreToolUse' | 'PermissionRequest'
  | 'PostToolUse' | 'PostToolUseFailure' | 'Stop'
  | 'SubagentStart' | 'SubagentStop' | 'Notification'
  | 'SessionStart' | 'SessionEnd' | 'PreCompact';
```

"Test Hook" button: runs hook with synthetic input JSON, shows exit code + stdout/stderr in a modal.

---

### 2.13 `<CheckpointList />`

Shown on hover over a message's timestamp / revert icon area.

```typescript
interface CheckpointListProps {
  workspaceId: string;
  turnId: string;
  onRevert: (checkpointId: string) => void;
}

interface Checkpoint {
  id: string;
  turnId: string;
  gitSha: string;
  workspaceId: string;
  createdAt: string;
  description: string;   // first line of user message that triggered it
}
```

Revert confirmation modal: warns that all messages + code changes from selected turn onward will be permanently deleted.

---

### 2.14 `<TodosPanel />`

Track required tasks before merging. Blocks the merge/PR button.

```typescript
interface TodosPanelProps {
  workspaceId: string;
}

interface Todo {
  id: string;
  workspaceId: string;
  text: string;
  completed: boolean;
  source: 'manual' | 'agent';  // agent-created via @todos tag
  createdAt: string;
}
```

Merge button state: disabled if any `completed === false` todo exists for the workspace.

---

## 3. State Management (Zustand Slices)

```typescript
// Global app store slices
useAppStore    → theme, activeWorkspaceId, sidebarCollapsed
useWorkspaceStore → workspaces[], repos[], activeRepo
useChatStore   → messages per workspaceId, streaming state
useSkillStore  → installed skills, available skills
useSettingsStore → model configs, backend auth, privacy settings
useCheckpointStore → checkpoints per workspaceId
useTodoStore   → todos per workspaceId
useHookStore   → hook configs per repoId
```

All stores persist relevant slices to `tauri-plugin-store` (Tauri's local storage, backed by JSON file at `~/.operator/ui-state.json`).

---

## 4. Theme System

Operator uses CSS custom properties for theming.

```css
/* Dark theme (default) */
:root[data-theme="dark"] {
  --bg-primary: #0d0d0d;
  --bg-secondary: #141414;
  --bg-tertiary: #1a1a1a;
  --bg-elevated: #1f1f1f;
  --border: rgba(255,255,255,0.08);
  --text-primary: #e8e8e8;
  --text-secondary: #9a9a9a;
  --text-tertiary: #5a5a5a;
  --accent-blue: #4d9fff;
  --accent-green: #3ccc74;
  --accent-amber: #f59e0b;
  --accent-red: #f04444;
  --accent-purple: #a78bfa;
}

/* Light theme */
:root[data-theme="light"] {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  /* ... */
}
```

Tailwind config extends with these tokens so both utility classes and component styles stay consistent.

---

## 5. Error Boundary Strategy

```
<App>
├── <GlobalErrorBoundary>   → catches unhandled React errors, shows crash UI
│   ├── <WorkspacePane>
│   │   └── <WorkspaceErrorBoundary>  → catches per-workspace errors, isolates crash
│   └── <TerminalTab>
│       └── <TerminalErrorBoundary>   → catches xterm.js errors
```

Each boundary logs to `tracing` (Rust) via Tauri event before rendering fallback UI.
