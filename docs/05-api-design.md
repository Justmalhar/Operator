# Operator — API Design (Tauri IPC Commands)

*Version 1.0 · March 2026*

All frontend↔backend communication uses Tauri's typed `invoke()` system. This document is the contract between React (TypeScript) and Rust.

---

## 1. Conventions

```typescript
// All commands follow this pattern in React:
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<ReturnType>('command_name', { param1, param2 });

// All commands return Result<T, OperatorError>
// Errors are thrown as strings in JS
```

```rust
// All commands in Rust:
#[tauri::command]
async fn command_name(
    state: tauri::State<'_, AppState>,
    param1: Type,
) -> Result<ReturnType, OperatorError> { ... }
```

---

## 2. Repository Commands

### `list_repositories`
```typescript
invoke<Repository[]>('list_repositories')
```

### `add_repository`
```typescript
invoke<Repository>('add_repository', {
  source: 'local' | 'url' | 'github',
  localPath?: string,         // if source === 'local'
  remoteUrl?: string,         // if source === 'url'
  githubRepo?: string,        // e.g. "Justmalhar/mobiiworld-skills-lib"
})
```

### `remove_repository`
```typescript
invoke<void>('remove_repository', {
  repositoryId: string,
  deleteWorkspaces: boolean,
})
```

### `sync_repository`
```typescript
// Fetches remote, updates branch list
invoke<RepositorySyncResult>('sync_repository', {
  repositoryId: string,
})
```

### `list_branches`
```typescript
invoke<Branch[]>('list_branches', {
  repositoryId: string,
  includeRemote?: boolean,
})
```

### `list_open_prs`
```typescript
invoke<PullRequest[]>('list_open_prs', {
  repositoryId: string,
})
```

---

## 3. Workspace Commands

### `create_workspace`
```typescript
invoke<Workspace>('create_workspace', {
  repositoryId: string,
  source: WorkspaceSource,
})

type WorkspaceSource =
  | { type: 'new_branch'; baseBranch: string }
  | { type: 'existing_branch'; branchName: string }
  | { type: 'pull_request'; prNumber: number }
  | { type: 'linear_issue'; issueId: string }
```

**Rust side performs:**
1. Allocate city name (from city list, avoid duplicates)
2. Allocate port range
3. `git2::Repository::worktree(...)` to create worktree at `~/operator/workspaces/<repo>/<city>/`
4. Run setup script if `operator.json` defines one
5. Insert into `workspaces` table
6. Return workspace struct

### `list_workspaces`
```typescript
invoke<Workspace[]>('list_workspaces', {
  repositoryId?: string,    // filter by repo; omit for all
  includeArchived?: boolean,
})
```

### `get_workspace`
```typescript
invoke<Workspace>('get_workspace', { workspaceId: string })
```

### `archive_workspace`
```typescript
invoke<void>('archive_workspace', {
  workspaceId: string,
  runArchiveScript?: boolean,
})
```

### `delete_workspace`
```typescript
invoke<void>('delete_workspace', {
  workspaceId: string,
  deleteWorktree: boolean,
})
```

### `rename_workspace`
```typescript
invoke<void>('rename_workspace', {
  workspaceId: string,
  name: string,   // becomes branch alias display name
})
```

### `switch_workspace_branch`
```typescript
invoke<void>('switch_workspace_branch', {
  workspaceId: string,
  branchName: string,
})
```

### `open_workspace_in_ide`
```typescript
invoke<void>('open_workspace_in_ide', {
  workspaceId: string,
  ide?: 'cursor' | 'vscode' | 'xcode' | 'default',
})
```

### `run_setup_script`
```typescript
invoke<ScriptResult>('run_setup_script', {
  workspaceId: string,
})
```

### `run_run_script`
```typescript
invoke<ScriptResult>('run_run_script', {
  workspaceId: string,
})
```

### `stop_run_script`
```typescript
invoke<void>('stop_run_script', { workspaceId: string })
```

---

## 4. Agent Commands

### `start_agent`
```typescript
invoke<void>('start_agent', {
  workspaceId: string,
  backend: 'claude' | 'codex' | 'gemini',
  model?: string,
  reasoningLevel?: 'fast' | 'medium' | 'high' | 'max',
})
```

**Rust side:**
1. Spawn Claude Code / Codex binary via `portable-pty`
2. Set cwd = worktree path
3. Inject `OPERATOR_*` env vars
4. Begin streaming PTY output via `tauri::emit("agent_output", ...)`

### `send_message`
```typescript
invoke<void>('send_message', {
  workspaceId: string,
  message: string,
  attachments?: AgentAttachment[],
})

interface AgentAttachment {
  type: 'image' | 'file';
  name: string;
  mimeType: string;
  base64?: string;
  filePath?: string;
}
```

**Rust side:**
1. Create checkpoint (`refs/operator/checkpoints/<ws>/<turn>`)
2. Write message text + attachments to PTY stdin
3. Agent processes and streams output back

### `queue_message`
```typescript
// Queues a message to send after agent finishes current turn
invoke<void>('queue_message', {
  workspaceId: string,
  message: string,
})
```

### `stop_agent`
```typescript
invoke<void>('stop_agent', { workspaceId: string })
```

### `cancel_tool_call`
```typescript
// Interrupt a specific tool call mid-execution
invoke<void>('cancel_tool_call', {
  workspaceId: string,
  toolCallId: string,
})
```

---

## 5. Git Commands

### `get_diff`
```typescript
invoke<WorkspaceDiff>('get_diff', {
  workspaceId: string,
  filePath?: string,   // specific file; omit for all changed files
})

interface WorkspaceDiff {
  files: FileDiff[];
  stats: { additions: number; deletions: number; filesChanged: number };
}
```

### `get_file_content`
```typescript
invoke<string>('get_file_content', {
  workspaceId: string,
  filePath: string,
  version?: 'head' | 'working',  // default 'working'
})
```

### `list_changed_files`
```typescript
invoke<ChangedFile[]>('list_changed_files', {
  workspaceId: string,
})

interface ChangedFile {
  path: string;
  status: 'added' | 'modified' | 'deleted' | 'renamed' | 'untracked';
  additions: number;
  deletions: number;
}
```

### `create_commit`
```typescript
invoke<string>('create_commit', {  // returns git SHA
  workspaceId: string,
  message: string,
  files?: string[],   // specific files; omit to stage all
})
```

### `push_branch`
```typescript
invoke<void>('push_branch', {
  workspaceId: string,
  force?: boolean,
})
```

### `create_pr`
```typescript
invoke<PullRequest>('create_pr', {
  workspaceId: string,
  title: string,
  body: string,
  draft?: boolean,
  baseBranch?: string,
  reviewers?: string[],
  labels?: string[],
})
```

### `revert_to_checkpoint`
```typescript
invoke<void>('revert_to_checkpoint', {
  workspaceId: string,
  checkpointId: string,
})
// Destructive: permanently deletes messages + code changes after checkpoint
```

### `list_checkpoints`
```typescript
invoke<Checkpoint[]>('list_checkpoints', {
  workspaceId: string,
})
```

### `list_workspace_files`
```typescript
invoke<WorkspaceFileIndex>('list_workspace_files', {
  workspaceId: string,
  // Returns file tree for @ mention search indexing
})
```

---

## 6. Shell Commands

### `run_shell_command`
```typescript
// Used for ! prefix injection in composer
invoke<ShellResult>('run_shell_command', {
  workspaceId: string,
  command: string,
  timeout_ms?: number,  // default 10_000
})

interface ShellResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  duration_ms: number;
}
```

### `create_terminal_session`
```typescript
invoke<string>('create_terminal_session', {  // returns terminalId
  workspaceId: string,
})
```

### `write_terminal`
```typescript
invoke<void>('write_terminal', {
  terminalId: string,
  data: string,  // raw PTY input
})
```

### `resize_terminal`
```typescript
invoke<void>('resize_terminal', {
  terminalId: string,
  cols: number,
  rows: number,
})
```

---

## 7. Skill Commands

### `list_skills`
```typescript
invoke<Skill[]>('list_skills', {
  scope?: 'all' | 'global' | 'repo',
  repositoryId?: string,
  includeBuiltins?: boolean,
})
```

### `install_skill`
```typescript
invoke<void>('install_skill', {
  skillId: string,
  scope: 'global' | 'repo',
  repositoryId?: string,  // required if scope === 'repo'
})
```

### `uninstall_skill`
```typescript
invoke<void>('uninstall_skill', {
  skillId: string,
  repositoryId?: string,
})
```

### `create_custom_skill`
```typescript
invoke<Skill>('create_custom_skill', {
  name: string,
  description: string,
  skillMdContent: string,
  scope: 'global' | 'repo',
  repositoryId?: string,
})
```

---

## 8. Settings Commands

### `get_settings`
```typescript
invoke<AppSettings>('get_settings')
```

### `update_settings`
```typescript
invoke<void>('update_settings', {
  settings: Partial<AppSettings>,
})
```

### `get_auth_status`
```typescript
invoke<AuthStatus>('get_auth_status')

interface AuthStatus {
  claude: { authenticated: boolean; account?: string; plan?: string };
  codex: { authenticated: boolean; account?: string };
  github: { authenticated: boolean; account?: string };
  gitlab: { authenticated: boolean; account?: string };
}
```

### `authenticate_backend`
```typescript
invoke<void>('authenticate_backend', {
  backend: 'claude' | 'codex' | 'github' | 'gitlab',
  method: 'oauth' | 'api_key' | 'device_flow',
  apiKey?: string,  // only if method === 'api_key', stored in OS keychain
})
```

---

## 9. Tauri Events (Rust → React)

All events are emitted via `tauri::emit` and received with `listen()` in React.

```typescript
import { listen } from '@tauri-apps/api/event';

// Agent PTY output stream
listen<AgentOutputPayload>('agent_output', handler)
interface AgentOutputPayload {
  workspaceId: string;
  chunk: string;       // raw PTY bytes as string
  turnId: string;
}

// Agent status changes
listen<WorkspaceStatusPayload>('workspace_status_changed', handler)
interface WorkspaceStatusPayload {
  workspaceId: string;
  status: WorkspaceStatus;
  reason?: string;
}

// Checkpoint created
listen<CheckpointPayload>('checkpoint_created', handler)
interface CheckpointPayload {
  workspaceId: string;
  turnId: string;
  checkpointId: string;
  gitSha: string;
}

// Git diff updated (debounced, 500ms after last file change)
listen<DiffUpdatedPayload>('diff_updated', handler)
interface DiffUpdatedPayload {
  workspaceId: string;
  changedFiles: string[];
}

// Hook triggered
listen<HookTriggeredPayload>('hook_triggered', handler)
interface HookTriggeredPayload {
  workspaceId: string;
  hookId: string;
  event: HookEvent;
  decision?: 'allow' | 'deny' | 'ask';
}

// Cost update (per agent turn completion)
listen<CostUpdatePayload>('cost_updated', handler)
interface CostUpdatePayload {
  workspaceId: string;
  turnCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
}

// Desktop notification
listen<NotificationPayload>('desktop_notification', handler)
interface NotificationPayload {
  workspaceId: string;
  type: 'permission_prompt' | 'idle' | 'task_complete' | 'error';
  message: string;
}
```

---

## 10. Error Types

```typescript
// All invoke() calls may throw OperatorError as a string
type OperatorError =
  | 'NotFound'                  // workspace/repo/skill not found
  | 'AlreadyExists'             // duplicate workspace, branch collision
  | 'GitError:${detail}'        // libgit2 error
  | 'ProcessError:${detail}'    // PTY/subprocess failure
  | 'AuthError:${backend}'      // not authenticated
  | 'PermissionDenied'          // OS permission refused
  | 'NetworkError:${detail}'    // GitHub/GitLab API failure
  | 'WorktreeConflict'          // branch already checked out elsewhere
  | 'ScriptError:${exitCode}'   // setup/run script failed
  | 'DatabaseError:${detail}'   // SQLite error
  | 'InvalidConfig:${field}'    // operator.json parse error
  | 'Unknown:${detail}';
```

React error handling pattern:
```typescript
try {
  await invoke('create_workspace', { ... });
} catch (err) {
  const error = err as string;
  if (error.startsWith('WorktreeConflict')) {
    showToast('Branch already open in another workspace', 'error');
  } else if (error.startsWith('AuthError')) {
    openSettingsPanel('backends');
  }
}
```
