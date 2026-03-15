import { describe, it, expect, beforeEach } from "vitest";
import { __setInvokeHandler, __invokeCalls, __clearInvokeCalls } from "../__mocks__/tauri-core";
import * as api from "../lib/tauri";
import type { Repository, Workspace } from "../types/workspace";
import type { FileEntry } from "../types/file";
import type { DiffResult, FileStatus } from "../types/git";

const MOCK_REPO: Repository = {
  id: "repo-1",
  name: "test-repo",
  full_name: "user/test-repo",
  remote_url: "https://github.com/user/test-repo.git",
  local_path: "/home/user/test-repo",
  platform: "github",
  default_branch: "main",
  icon_path: null,
  operator_json: null,
  last_synced: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const MOCK_WORKSPACE: Workspace = {
  id: "ws-1",
  repository_id: "repo-1",
  city_name: "Tokyo",
  branch_name: "feature/test",
  worktree_path: "/home/user/Tokyo",
  status: "idle",
  agent_backend: "claude",
  model: null,
  reasoning_level: null,
  port_base: 3000,
  pr_url: null,
  pr_number: null,
  total_cost_usd: 0,
  total_tokens: 0,
  is_archived: 0,
  archived_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

beforeEach(() => {
  __clearInvokeCalls();
});

describe("Repository API", () => {
  it("listRepositories calls list_repositories", async () => {
    __setInvokeHandler((cmd) => {
      if (cmd === "list_repositories") return [MOCK_REPO];
      throw new Error(`unexpected: ${cmd}`);
    });

    const repos = await api.listRepositories();
    expect(repos).toHaveLength(1);
    expect(repos[0].name).toBe("test-repo");
    expect(__invokeCalls[0].cmd).toBe("list_repositories");
  });

  it("addRepository calls add_repository with input", async () => {
    __setInvokeHandler((cmd) => {
      if (cmd === "add_repository") return MOCK_REPO;
      throw new Error(`unexpected: ${cmd}`);
    });

    const repo = await api.addRepository({
      name: "test-repo",
      full_name: "user/test-repo",
      remote_url: "https://github.com/user/test-repo.git",
      local_path: "/home/user/test-repo",
    });

    expect(repo.id).toBe("repo-1");
    expect(__invokeCalls[0].cmd).toBe("add_repository");
    expect(__invokeCalls[0].args?.input).toBeDefined();
  });

  it("removeRepository calls remove_repository", async () => {
    __setInvokeHandler(() => undefined);

    await api.removeRepository("repo-1");
    expect(__invokeCalls[0].cmd).toBe("remove_repository");
    expect(__invokeCalls[0].args?.id).toBe("repo-1");
  });
});

describe("Workspace API", () => {
  it("listWorkspaces calls list_workspaces with repositoryId", async () => {
    __setInvokeHandler((cmd) => {
      if (cmd === "list_workspaces") return [MOCK_WORKSPACE];
      throw new Error(`unexpected: ${cmd}`);
    });

    const workspaces = await api.listWorkspaces("repo-1");
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].city_name).toBe("Tokyo");
    expect(__invokeCalls[0].args?.repositoryId).toBe("repo-1");
  });

  it("getWorkspace calls get_workspace", async () => {
    __setInvokeHandler(() => MOCK_WORKSPACE);

    const ws = await api.getWorkspace("ws-1");
    expect(ws.id).toBe("ws-1");
    expect(ws.status).toBe("idle");
  });

  it("deleteWorkspace calls delete_workspace", async () => {
    __setInvokeHandler(() => undefined);

    await api.deleteWorkspace("ws-1");
    expect(__invokeCalls[0].cmd).toBe("delete_workspace");
  });

  it("setWorkspaceStatus calls set_workspace_status", async () => {
    __setInvokeHandler(() => undefined);

    await api.setWorkspaceStatus("ws-1", "running");
    expect(__invokeCalls[0].cmd).toBe("set_workspace_status");
    expect(__invokeCalls[0].args?.status).toBe("running");
  });
});

describe("Git API", () => {
  it("getGitStatus calls get_git_status", async () => {
    const mockStatus: FileStatus[] = [
      { path: "src/main.ts", staged: false, unstaged: true, untracked: false, conflicted: false, xy: " M" },
    ];
    __setInvokeHandler(() => mockStatus);

    const status = await api.getGitStatus("/repo");
    expect(status).toHaveLength(1);
    expect(status[0].path).toBe("src/main.ts");
  });

  it("getGitDiff calls get_git_diff with withPatch", async () => {
    const mockDiff: DiffResult = {
      files: [{ path: "file.ts", old_path: null, status: "modified", insertions: 5, deletions: 2 }],
      total_insertions: 5,
      total_deletions: 2,
      patch: null,
    };
    __setInvokeHandler(() => mockDiff);

    const diff = await api.getGitDiff("/repo", false);
    expect(diff.files).toHaveLength(1);
    expect(diff.total_insertions).toBe(5);
    expect(__invokeCalls[0].args?.withPatch).toBe(false);
  });

  it("gitStage calls git_stage with paths", async () => {
    __setInvokeHandler(() => undefined);

    await api.gitStage("/repo", ["file1.ts", "file2.ts"]);
    expect(__invokeCalls[0].cmd).toBe("git_stage");
    expect(__invokeCalls[0].args?.paths).toEqual(["file1.ts", "file2.ts"]);
  });

  it("gitCommit calls git_commit and returns sha", async () => {
    __setInvokeHandler(() => "abc123def456");

    const sha = await api.gitCommit("/repo", "fix: something");
    expect(sha).toBe("abc123def456");
    expect(__invokeCalls[0].args?.message).toBe("fix: something");
  });

  it("getCurrentBranch returns branch name", async () => {
    __setInvokeHandler(() => "feature/test");

    const branch = await api.getCurrentBranch("/repo");
    expect(branch).toBe("feature/test");
  });
});

describe("File API", () => {
  it("listDirectory calls list_directory", async () => {
    const mockEntries: FileEntry[] = [
      { name: "src", path: "/repo/src", is_dir: true, size: null, extension: null },
      { name: "main.ts", path: "/repo/main.ts", is_dir: false, size: 1024, extension: "ts" },
    ];
    __setInvokeHandler(() => mockEntries);

    const entries = await api.listDirectory("/repo");
    expect(entries).toHaveLength(2);
    expect(entries[0].is_dir).toBe(true);
    expect(entries[1].extension).toBe("ts");
  });

  it("readFile returns file content", async () => {
    __setInvokeHandler(() => "console.log('hello');");

    const content = await api.readFile("/repo/main.ts");
    expect(content).toBe("console.log('hello');");
  });

  it("writeFile calls write_file", async () => {
    __setInvokeHandler(() => undefined);

    await api.writeFile("/repo/main.ts", "new content");
    expect(__invokeCalls[0].cmd).toBe("write_file");
    expect(__invokeCalls[0].args?.content).toBe("new content");
  });
});

describe("Agent API", () => {
  it("launchAgent calls launch_agent", async () => {
    __setInvokeHandler(() => undefined);

    await api.launchAgent("ws-1", "/repo", "fix the bug");
    expect(__invokeCalls[0].cmd).toBe("launch_agent");
    expect(__invokeCalls[0].args?.workspaceId).toBe("ws-1");
    expect(__invokeCalls[0].args?.initialPrompt).toBe("fix the bug");
  });

  it("stopAgent calls stop_agent", async () => {
    __setInvokeHandler(() => undefined);

    await api.stopAgent("ws-1");
    expect(__invokeCalls[0].cmd).toBe("stop_agent");
  });

  it("isAgentRunning returns boolean", async () => {
    __setInvokeHandler(() => true);

    const running = await api.isAgentRunning("ws-1");
    expect(running).toBe(true);
  });
});

describe("Shell API", () => {
  it("runShellCommand returns stdout/stderr/exit_code", async () => {
    __setInvokeHandler(() => ({ stdout: "hello\n", stderr: "", exit_code: 0 }));

    const result = await api.runShellCommand("echo hello", "/repo");
    expect(result.stdout).toBe("hello\n");
    expect(result.exit_code).toBe(0);
    expect(__invokeCalls[0].args?.cwd).toBe("/repo");
  });
});

describe("Settings API", () => {
  it("getSetting calls get_setting", async () => {
    __setInvokeHandler(() => "dark");

    const val = await api.getSetting("theme");
    expect(val).toBe("dark");
  });

  it("setSetting calls set_setting", async () => {
    __setInvokeHandler(() => undefined);

    await api.setSetting("theme", "light");
    expect(__invokeCalls[0].args?.key).toBe("theme");
    expect(__invokeCalls[0].args?.value).toBe("light");
  });
});
