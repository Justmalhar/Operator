import { describe, it, expect, beforeEach } from "vitest";
import { __setInvokeHandler } from "../__mocks__/tauri-core";
import { useWorkspaceStore } from "../store/workspaceStore";
import type { Repository, Workspace } from "../types/workspace";

const REPO_A: Repository = {
  id: "repo-a",
  name: "alpha",
  full_name: "org/alpha",
  remote_url: "https://github.com/org/alpha.git",
  local_path: "/home/user/alpha",
  platform: "github",
  default_branch: "main",
  icon_path: null,
  operator_json: null,
  last_synced: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const REPO_B: Repository = {
  id: "repo-b",
  name: "beta",
  full_name: "org/beta",
  remote_url: "https://github.com/org/beta.git",
  local_path: "/home/user/beta",
  platform: "github",
  default_branch: "main",
  icon_path: null,
  operator_json: null,
  last_synced: null,
  created_at: "2025-01-02T00:00:00Z",
  updated_at: "2025-01-02T00:00:00Z",
};

const WS_1: Workspace = {
  id: "ws-1",
  repository_id: "repo-a",
  city_name: "Tokyo",
  branch_name: "feature/auth",
  worktree_path: "/home/user/Tokyo",
  status: "idle",
  agent_backend: "claude",
  model: null,
  reasoning_level: null,
  port_base: 3000,
  pr_url: null,
  pr_number: null,
  total_cost_usd: 0.5,
  total_tokens: 1000,
  is_archived: 0,
  archived_at: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

const WS_2: Workspace = {
  id: "ws-2",
  repository_id: "repo-a",
  city_name: "Berlin",
  branch_name: "feature/api",
  worktree_path: "/home/user/Berlin",
  status: "running",
  agent_backend: "gemini",
  model: "gemini-2.0-flash",
  reasoning_level: null,
  port_base: 3010,
  pr_url: null,
  pr_number: null,
  total_cost_usd: 0,
  total_tokens: 0,
  is_archived: 0,
  archived_at: null,
  created_at: "2025-01-02T00:00:00Z",
  updated_at: "2025-01-02T00:00:00Z",
};

beforeEach(() => {
  // Reset store between tests
  useWorkspaceStore.setState({
    repos: [],
    workspacesByRepo: {},
    activeWorkspaceId: null,
    loading: false,
    error: null,
  });
});

describe("workspaceStore", () => {
  describe("fetchAll", () => {
    it("loads repos and workspaces from backend", async () => {
      __setInvokeHandler((cmd, args) => {
        if (cmd === "list_repositories") return [REPO_A, REPO_B];
        if (cmd === "list_workspaces") {
          if (args?.repositoryId === "repo-a") return [WS_1, WS_2];
          if (args?.repositoryId === "repo-b") return [];
        }
        return [];
      });

      await useWorkspaceStore.getState().fetchAll();
      const state = useWorkspaceStore.getState();

      expect(state.repos).toHaveLength(2);
      expect(state.repos[0].name).toBe("alpha");
      expect(state.repos[1].name).toBe("beta");
      expect(state.workspacesByRepo["repo-a"]).toHaveLength(2);
      expect(state.workspacesByRepo["repo-b"]).toHaveLength(0);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("sets error on failure", async () => {
      __setInvokeHandler(() => {
        throw new Error("network error");
      });

      await useWorkspaceStore.getState().fetchAll();
      const state = useWorkspaceStore.getState();

      expect(state.error).toBe("network error");
      expect(state.loading).toBe(false);
    });

    it("sets loading to true during fetch", async () => {
      let resolveList: ((v: Repository[]) => void) | undefined;
      __setInvokeHandler((cmd) => {
        if (cmd === "list_repositories") {
          return new Promise<Repository[]>((r) => { resolveList = r; });
        }
        return [];
      });

      const fetchPromise = useWorkspaceStore.getState().fetchAll();
      expect(useWorkspaceStore.getState().loading).toBe(true);

      resolveList?.([]);
      await fetchPromise;
      expect(useWorkspaceStore.getState().loading).toBe(false);
    });
  });

  describe("addRepo", () => {
    it("adds repo to state", async () => {
      __setInvokeHandler(() => REPO_A);

      await useWorkspaceStore.getState().addRepo({
        name: "alpha",
        full_name: "org/alpha",
        remote_url: "",
        local_path: "/home/user/alpha",
      });

      const state = useWorkspaceStore.getState();
      expect(state.repos).toHaveLength(1);
      expect(state.workspacesByRepo["repo-a"]).toEqual([]);
    });
  });

  describe("removeRepo", () => {
    it("removes repo from state", async () => {
      useWorkspaceStore.setState({
        repos: [REPO_A, REPO_B],
        workspacesByRepo: { "repo-a": [WS_1], "repo-b": [] },
      });
      __setInvokeHandler(() => undefined);

      await useWorkspaceStore.getState().removeRepo("repo-a");
      const state = useWorkspaceStore.getState();

      expect(state.repos).toHaveLength(1);
      expect(state.repos[0].id).toBe("repo-b");
      expect(state.workspacesByRepo["repo-a"]).toBeUndefined();
    });
  });

  describe("setActiveWorkspace", () => {
    it("sets activeWorkspaceId", () => {
      useWorkspaceStore.getState().setActiveWorkspace("ws-1");
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-1");
    });

    it("can set to null", () => {
      useWorkspaceStore.getState().setActiveWorkspace("ws-1");
      useWorkspaceStore.getState().setActiveWorkspace(null);
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBeNull();
    });
  });

  describe("getActiveWorkspace", () => {
    it("returns workspace by active ID", () => {
      useWorkspaceStore.setState({
        repos: [REPO_A],
        workspacesByRepo: { "repo-a": [WS_1, WS_2] },
        activeWorkspaceId: "ws-2",
      });

      const ws = useWorkspaceStore.getState().getActiveWorkspace();
      expect(ws?.id).toBe("ws-2");
      expect(ws?.city_name).toBe("Berlin");
    });

    it("returns undefined when no active workspace", () => {
      useWorkspaceStore.setState({ activeWorkspaceId: null });
      expect(useWorkspaceStore.getState().getActiveWorkspace()).toBeUndefined();
    });
  });

  describe("updateWorkspaceStatus", () => {
    it("updates workspace status in place", () => {
      useWorkspaceStore.setState({
        repos: [REPO_A],
        workspacesByRepo: { "repo-a": [WS_1] },
      });

      useWorkspaceStore.getState().updateWorkspaceStatus("ws-1", "running");

      const ws = useWorkspaceStore.getState().workspacesByRepo["repo-a"][0];
      expect(ws.status).toBe("running");
    });
  });

  describe("getRepoList", () => {
    it("returns repos with their workspaces", () => {
      useWorkspaceStore.setState({
        repos: [REPO_A, REPO_B],
        workspacesByRepo: { "repo-a": [WS_1, WS_2], "repo-b": [] },
      });

      const list = useWorkspaceStore.getState().getRepoList();
      expect(list).toHaveLength(2);
      expect(list[0].repo.name).toBe("alpha");
      expect(list[0].workspaces).toHaveLength(2);
      expect(list[0].isExpanded).toBe(true);
      expect(list[1].workspaces).toHaveLength(0);
    });
  });

  describe("deleteWorkspace", () => {
    it("removes workspace and clears active if matching", async () => {
      useWorkspaceStore.setState({
        repos: [REPO_A],
        workspacesByRepo: { "repo-a": [WS_1, WS_2] },
        activeWorkspaceId: "ws-1",
      });
      __setInvokeHandler(() => undefined);

      await useWorkspaceStore.getState().deleteWorkspace("ws-1", "repo-a");
      const state = useWorkspaceStore.getState();

      expect(state.workspacesByRepo["repo-a"]).toHaveLength(1);
      expect(state.workspacesByRepo["repo-a"][0].id).toBe("ws-2");
      expect(state.activeWorkspaceId).toBeNull();
    });

    it("does not clear active if non-matching workspace deleted", async () => {
      useWorkspaceStore.setState({
        repos: [REPO_A],
        workspacesByRepo: { "repo-a": [WS_1, WS_2] },
        activeWorkspaceId: "ws-1",
      });
      __setInvokeHandler(() => undefined);

      await useWorkspaceStore.getState().deleteWorkspace("ws-2", "repo-a");
      expect(useWorkspaceStore.getState().activeWorkspaceId).toBe("ws-1");
    });
  });
});
