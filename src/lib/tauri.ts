import type { LogEntry } from "./logger";
import type { Repository, CreateRepository, Workspace } from "@/types/workspace";
import type { FileEntry } from "@/types/file";
import type { FileStatus, DiffResult, CommitInfo } from "@/types/git";

import { invoke } from "@tauri-apps/api/core";

// ---------------------------------------------------------------------------
// Tauri runtime detection
// ---------------------------------------------------------------------------

/** True when running inside a Tauri webview with IPC available. */
export const isTauri: boolean =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/**
 * Safe invoke wrapper — calls the real Tauri invoke when the backend is
 * available, otherwise returns a fallback value.
 */
async function safeInvoke<T>(cmd: string, args?: Record<string, unknown>, fallback?: T): Promise<T> {
  if (!isTauri) {
    if (fallback !== undefined) return fallback;
    throw new Error(`Tauri backend unavailable — cannot invoke "${cmd}"`);
  }
  return invoke<T>(cmd, args);
}

// ---------------------------------------------------------------------------
// Mock data for browser-only development
// ---------------------------------------------------------------------------

const MOCK_REPO: Repository = {
  id: "mock-repo-1",
  name: "operator",
  full_name: "Justmalhar/Operator",
  remote_url: "https://github.com/Justmalhar/Operator.git",
  local_path: "/Users/demo/projects/operator",
  platform: "github",
  default_branch: "main",
  icon_path: null,
  operator_json: null,
  last_synced: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_WORKSPACE: Workspace = {
  id: "mock-ws-1",
  repository_id: "mock-repo-1",
  city_name: "Barcelona",
  branch_name: "feature/ui-overhaul",
  worktree_path: "/Users/demo/projects/operator",
  status: "idle",
  agent_backend: "claude",
  model: "claude-opus-4-6",
  reasoning_level: null,
  port_base: null,
  pr_url: null,
  pr_number: null,
  total_cost_usd: 0,
  total_tokens: 0,
  is_archived: 0,
  archived_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_WORKSPACE_2: Workspace = {
  id: "mock-ws-2",
  repository_id: "mock-repo-1",
  city_name: "Tokyo",
  branch_name: "fix/auth-flow",
  worktree_path: "/Users/demo/projects/operator",
  status: "running",
  agent_backend: "claude",
  model: "claude-sonnet-4-6",
  reasoning_level: null,
  port_base: null,
  pr_url: null,
  pr_number: null,
  total_cost_usd: 1.24,
  total_tokens: 48200,
  is_archived: 0,
  archived_at: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const MOCK_FILES: FileEntry[] = [
  { name: "src", path: "/Users/demo/projects/operator/src", is_dir: true, size: null, extension: null },
  { name: "public", path: "/Users/demo/projects/operator/public", is_dir: true, size: null, extension: null },
  { name: "package.json", path: "/Users/demo/projects/operator/package.json", is_dir: false, size: 1420, extension: "json" },
  { name: "tsconfig.json", path: "/Users/demo/projects/operator/tsconfig.json", is_dir: false, size: 580, extension: "json" },
  { name: "vite.config.ts", path: "/Users/demo/projects/operator/vite.config.ts", is_dir: false, size: 320, extension: "ts" },
  { name: "README.md", path: "/Users/demo/projects/operator/README.md", is_dir: false, size: 2100, extension: "md" },
  { name: ".gitignore", path: "/Users/demo/projects/operator/.gitignore", is_dir: false, size: 120, extension: null },
];

const MOCK_SRC_FILES: FileEntry[] = [
  { name: "components", path: "/Users/demo/projects/operator/src/components", is_dir: true, size: null, extension: null },
  { name: "hooks", path: "/Users/demo/projects/operator/src/hooks", is_dir: true, size: null, extension: null },
  { name: "lib", path: "/Users/demo/projects/operator/src/lib", is_dir: true, size: null, extension: null },
  { name: "store", path: "/Users/demo/projects/operator/src/store", is_dir: true, size: null, extension: null },
  { name: "styles", path: "/Users/demo/projects/operator/src/styles", is_dir: true, size: null, extension: null },
  { name: "types", path: "/Users/demo/projects/operator/src/types", is_dir: true, size: null, extension: null },
  { name: "App.tsx", path: "/Users/demo/projects/operator/src/App.tsx", is_dir: false, size: 3200, extension: "tsx" },
  { name: "main.tsx", path: "/Users/demo/projects/operator/src/main.tsx", is_dir: false, size: 480, extension: "tsx" },
];

const MOCK_COMPONENTS_FILES: FileEntry[] = [
  { name: "chat", path: "/Users/demo/projects/operator/src/components/chat", is_dir: true, size: null, extension: null },
  { name: "center", path: "/Users/demo/projects/operator/src/components/center", is_dir: true, size: null, extension: null },
  { name: "layout", path: "/Users/demo/projects/operator/src/components/layout", is_dir: true, size: null, extension: null },
  { name: "panels", path: "/Users/demo/projects/operator/src/components/panels", is_dir: true, size: null, extension: null },
  { name: "sidebar", path: "/Users/demo/projects/operator/src/components/sidebar", is_dir: true, size: null, extension: null },
  { name: "shared", path: "/Users/demo/projects/operator/src/components/shared", is_dir: true, size: null, extension: null },
];

const MOCK_DIFF: DiffResult = {
  files: [
    { path: "src/App.tsx", old_path: null, status: "modified", insertions: 42, deletions: 18 },
    { path: "src/lib/tauri.ts", old_path: null, status: "modified", insertions: 120, deletions: 45 },
    { path: "src/components/sidebar/WorkspaceList.tsx", old_path: null, status: "modified", insertions: 15, deletions: 8 },
    { path: "src/styles/themes/index.css", old_path: null, status: "modified", insertions: 30, deletions: 5 },
    { path: "src/lib/animations.ts", old_path: null, status: "added", insertions: 85, deletions: 0 },
  ],
  total_insertions: 292,
  total_deletions: 76,
  patch: null,
};

const MOCK_COMMITS: CommitInfo[] = [
  { sha: "a336f9a", message: "Redesign chat UI to match Conductor screenshot style", author: "Malhar", timestamp: new Date(Date.now() - 3600000).toISOString() },
  { sha: "219ddce", message: "Add VS Code Material Icon Theme to file explorer", author: "Malhar", timestamp: new Date(Date.now() - 7200000).toISOString() },
  { sha: "620831c", message: "Improve sidebar and panel spacing to match VSCode-grade design", author: "Malhar", timestamp: new Date(Date.now() - 10800000).toISOString() },
];

/** Returns mock files for a given directory path */
function getMockFilesForPath(path: string): FileEntry[] {
  if (path.endsWith("/src/components") || path.includes("components")) return MOCK_COMPONENTS_FILES;
  if (path.endsWith("/src") || path.endsWith("/src/")) return MOCK_SRC_FILES;
  return MOCK_FILES;
}

// ---------------------------------------------------------------------------
// Logging
// ---------------------------------------------------------------------------

export async function logFrontendEvents(entries: LogEntry[]): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] logFrontendEvents:", entries.length, "entries");
    return;
  }
  return safeInvoke("log_frontend_events", { entries });
}

// ---------------------------------------------------------------------------
// Repository commands
// ---------------------------------------------------------------------------

export async function listRepositories(): Promise<Repository[]> {
  if (!isTauri) return [MOCK_REPO];
  return safeInvoke<Repository[]>("list_repositories", undefined, []);
}

export async function addRepository(input: CreateRepository): Promise<Repository> {
  if (!isTauri) {
    const repo: Repository = {
      id: `mock-repo-${Date.now()}`,
      name: input.name,
      full_name: input.full_name,
      remote_url: input.remote_url,
      local_path: input.local_path,
      platform: input.platform ?? "github",
      default_branch: input.default_branch ?? "main",
      icon_path: input.icon_path ?? null,
      operator_json: input.operator_json ?? null,
      last_synced: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    return repo;
  }
  return safeInvoke<Repository>("add_repository", { input });
}

export async function removeRepository(id: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] removeRepository:", id);
    return;
  }
  return safeInvoke("remove_repository", { id });
}

// ---------------------------------------------------------------------------
// Workspace commands
// ---------------------------------------------------------------------------

export async function listWorkspaces(repositoryId: string): Promise<Workspace[]> {
  if (!isTauri) {
    if (repositoryId === "mock-repo-1") return [MOCK_WORKSPACE, MOCK_WORKSPACE_2];
    return [];
  }
  return safeInvoke<Workspace[]>("list_workspaces", { repositoryId }, []);
}

export async function getWorkspace(id: string): Promise<Workspace> {
  if (!isTauri) {
    if (id === "mock-ws-2") return MOCK_WORKSPACE_2;
    return MOCK_WORKSPACE;
  }
  return safeInvoke<Workspace>("get_workspace", { id });
}

export async function createWorkspace(params: {
  repositoryId: string;
  repoPath: string;
  cityName: string;
  branchName: string;
  baseBranch: string;
  agentBackend?: string;
  model?: string;
}): Promise<Workspace> {
  if (!isTauri) {
    return {
      id: `mock-ws-${Date.now()}`,
      repository_id: params.repositoryId,
      city_name: params.cityName,
      branch_name: params.branchName,
      worktree_path: params.repoPath,
      status: "idle",
      agent_backend: (params.agentBackend as Workspace["agent_backend"]) ?? "claude",
      model: params.model ?? null,
      reasoning_level: null,
      port_base: null,
      pr_url: null,
      pr_number: null,
      total_cost_usd: 0,
      total_tokens: 0,
      is_archived: 0,
      archived_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  return safeInvoke<Workspace>("create_workspace", params);
}

export async function deleteWorkspace(id: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] deleteWorkspace:", id);
    return;
  }
  return safeInvoke("delete_workspace", { id });
}

export async function archiveWorkspace(id: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] archiveWorkspace:", id);
    return;
  }
  return safeInvoke("archive_workspace", { id });
}

export async function setWorkspaceStatus(id: string, status: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] setWorkspaceStatus:", id, status);
    return;
  }
  return safeInvoke("set_workspace_status", { id, status });
}

// ---------------------------------------------------------------------------
// Agent commands
// ---------------------------------------------------------------------------

export async function launchAgent(
  workspaceId: string,
  repoPath: string,
  initialPrompt?: string,
): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] launchAgent:", workspaceId, repoPath, initialPrompt);
    return;
  }
  return safeInvoke("launch_agent", { workspaceId, repoPath, initialPrompt });
}

export async function stopAgent(workspaceId: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] stopAgent:", workspaceId);
    return;
  }
  return safeInvoke("stop_agent", { workspaceId });
}

export async function sendAgentInput(workspaceId: string, data: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] sendAgentInput:", workspaceId, data);
    return;
  }
  return safeInvoke("send_agent_input", { workspaceId, data });
}

export async function isAgentRunning(workspaceId: string): Promise<boolean> {
  if (!isTauri) return false;
  return safeInvoke<boolean>("is_agent_running", { workspaceId }, false);
}

export async function listActiveAgents(): Promise<string[]> {
  if (!isTauri) return [];
  return safeInvoke<string[]>("list_active_agents", undefined, []);
}

// ---------------------------------------------------------------------------
// Git commands
// ---------------------------------------------------------------------------

export async function getGitStatus(repoPath: string): Promise<FileStatus[]> {
  if (!isTauri) {
    return MOCK_DIFF.files.map((f) => ({
      path: f.path,
      staged: false,
      unstaged: true,
      untracked: f.status === "added",
      conflicted: false,
      xy: f.status === "added" ? "??" : " M",
    }));
  }
  return safeInvoke<FileStatus[]>("get_git_status", { repoPath }, []);
}

export async function getGitDiff(repoPath: string, withPatch: boolean): Promise<DiffResult> {
  if (!isTauri) return MOCK_DIFF;
  return safeInvoke<DiffResult>("get_git_diff", { repoPath, withPatch }, { files: [], total_insertions: 0, total_deletions: 0, patch: null });
}

export async function getStagedDiff(repoPath: string): Promise<DiffResult> {
  if (!isTauri) return { files: [], total_insertions: 0, total_deletions: 0, patch: null };
  return safeInvoke<DiffResult>("get_staged_diff", { repoPath }, { files: [], total_insertions: 0, total_deletions: 0, patch: null });
}

export async function getFileDiff(repoPath: string, filePath: string): Promise<string> {
  if (!isTauri) return `--- a/${filePath}\n+++ b/${filePath}\n@@ -1,3 +1,5 @@\n+// New import\n import React from 'react';\n \n-export default function Component() {\n+export default function EnhancedComponent() {\n+  const [state, setState] = useState(false);\n   return <div>Hello</div>;\n }`;
  return safeInvoke<string>("get_file_diff", { repoPath, filePath }, "");
}

export async function getGitLog(repoPath: string, limit?: number): Promise<CommitInfo[]> {
  if (!isTauri) return MOCK_COMMITS.slice(0, limit ?? MOCK_COMMITS.length);
  return safeInvoke<CommitInfo[]>("get_git_log", { repoPath, limit }, []);
}

export async function getCurrentBranch(repoPath: string): Promise<string> {
  if (!isTauri) return "feature/ui-overhaul";
  return safeInvoke<string>("get_current_branch", { repoPath }, "main");
}

export async function gitStage(repoPath: string, paths: string[]): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] gitStage:", repoPath, paths);
    return;
  }
  return safeInvoke("git_stage", { repoPath, paths });
}

export async function gitUnstage(repoPath: string, paths: string[]): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] gitUnstage:", repoPath, paths);
    return;
  }
  return safeInvoke("git_unstage", { repoPath, paths });
}

export async function gitDiscard(repoPath: string, path: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] gitDiscard:", repoPath, path);
    return;
  }
  return safeInvoke("git_discard", { repoPath, path });
}

export async function gitCommit(repoPath: string, message: string): Promise<string> {
  if (!isTauri) {
    console.debug("[mock] gitCommit:", repoPath, message);
    return "mock-commit-sha-" + Date.now().toString(36);
  }
  return safeInvoke<string>("git_commit", { repoPath, message }, "");
}

export async function gitPush(repoPath: string, remote?: string, branch?: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] gitPush:", repoPath, remote, branch);
    return;
  }
  return safeInvoke("git_push", { repoPath, remote, branch });
}

// ---------------------------------------------------------------------------
// File commands
// ---------------------------------------------------------------------------

export async function listDirectory(path: string): Promise<FileEntry[]> {
  if (!isTauri) return getMockFilesForPath(path);
  return safeInvoke<FileEntry[]>("list_directory", { path }, []);
}

export async function readFile(path: string): Promise<string> {
  if (!isTauri) return `// Mock file content for: ${path}\n// Running without Tauri backend.\n\nexport {};\n`;
  return safeInvoke<string>("read_file", { path }, "");
}

export async function writeFile(path: string, content: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] writeFile:", path, `(${content.length} chars)`);
    return;
  }
  return safeInvoke("write_file", { path, content });
}

export async function fileExists(path: string): Promise<boolean> {
  if (!isTauri) return true;
  return safeInvoke<boolean>("file_exists", { path }, false);
}

export async function deleteFile(path: string): Promise<void> {
  if (!isTauri) {
    console.debug("[mock] deleteFile:", path);
    return;
  }
  return safeInvoke("delete_file", { path });
}

// ---------------------------------------------------------------------------
// Shell commands
// ---------------------------------------------------------------------------

export interface ShellResult {
  stdout: string;
  stderr: string;
  exit_code: number;
}

export async function runShellCommand(command: string, cwd?: string): Promise<ShellResult> {
  if (!isTauri) {
    console.debug("[mock] runShellCommand:", command, cwd);
    return { stdout: `$ ${command}\n[mock] Command executed successfully.\n`, stderr: "", exit_code: 0 };
  }
  return safeInvoke<ShellResult>("run_shell_command", { command, cwd });
}

export async function runShellScript(script: string, cwd?: string): Promise<ShellResult> {
  if (!isTauri) {
    console.debug("[mock] runShellScript:", script, cwd);
    return { stdout: "[mock] Script executed.\n", stderr: "", exit_code: 0 };
  }
  return safeInvoke<ShellResult>("run_shell_script", { script, cwd });
}

// ---------------------------------------------------------------------------
// Settings commands
// ---------------------------------------------------------------------------

const mockSettings: Record<string, unknown> = {
  theme: "dark-default",
  fontSize: 13,
  fontFamily: "SF Mono",
};

export async function getSetting(key: string): Promise<unknown> {
  if (!isTauri) return mockSettings[key] ?? null;
  return safeInvoke("get_setting", { key });
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  if (!isTauri) {
    mockSettings[key] = value;
    console.debug("[mock] setSetting:", key, value);
    return;
  }
  return safeInvoke("set_setting", { key, value });
}

export async function getAllSettings(): Promise<Record<string, unknown>> {
  if (!isTauri) return { ...mockSettings };
  return safeInvoke<Record<string, unknown>>("get_all_settings", undefined, {});
}
