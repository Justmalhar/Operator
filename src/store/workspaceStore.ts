import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { Repository, Workspace, CreateRepository, RepoWithWorkspaces } from "@/types/workspace";
import * as api from "@/lib/tauri";

interface WorkspaceState {
  repos: Repository[];
  workspacesByRepo: Record<string, Workspace[]>;
  activeWorkspaceId: string | null;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  addRepo: (input: CreateRepository) => Promise<Repository>;
  removeRepo: (id: string) => Promise<void>;
  createWorkspace: (params: {
    repositoryId: string;
    repoPath: string;
    cityName: string;
    branchName: string;
    baseBranch: string;
    agentBackend?: string;
    model?: string;
  }) => Promise<Workspace>;
  deleteWorkspace: (id: string, repoId: string) => Promise<void>;
  setActiveWorkspace: (id: string | null) => void;
  updateWorkspaceStatus: (workspaceId: string, status: string) => void;
  getActiveWorkspace: () => Workspace | undefined;
  getRepoList: () => RepoWithWorkspaces[];
}

export const useWorkspaceStore = create<WorkspaceState>()(
  immer((set, get) => ({
    repos: [],
    workspacesByRepo: {},
    activeWorkspaceId: null,
    loading: false,
    error: null,

    fetchAll: async () => {
      set((s) => {
        s.loading = true;
        s.error = null;
      });
      try {
        const repos = await api.listRepositories();
        const byRepo: Record<string, Workspace[]> = {};

        const results = await Promise.allSettled(
          repos.map(async (r) => {
            const ws = await api.listWorkspaces(r.id);
            return { repoId: r.id, workspaces: ws };
          }),
        );

        for (const result of results) {
          if (result.status === "fulfilled") {
            byRepo[result.value.repoId] = result.value.workspaces;
          }
        }

        set((s) => {
          s.repos = repos;
          s.workspacesByRepo = byRepo;
          s.loading = false;
        });
      } catch (err) {
        set((s) => {
          s.error = err instanceof Error ? err.message : String(err);
          s.loading = false;
        });
      }
    },

    addRepo: async (input) => {
      const repo = await api.addRepository(input);
      set((s) => {
        s.repos.push(repo);
        s.workspacesByRepo[repo.id] = [];
      });
      return repo;
    },

    removeRepo: async (id) => {
      await api.removeRepository(id);
      set((s) => {
        s.repos = s.repos.filter((r) => r.id !== id);
        delete s.workspacesByRepo[id];
      });
    },

    createWorkspace: async (params) => {
      const ws = await api.createWorkspace(params);
      set((s) => {
        const list = s.workspacesByRepo[params.repositoryId] ?? [];
        list.push(ws);
        s.workspacesByRepo[params.repositoryId] = list;
      });
      return ws;
    },

    deleteWorkspace: async (id, repoId) => {
      await api.deleteWorkspace(id);
      set((s) => {
        const list = s.workspacesByRepo[repoId];
        if (list) {
          s.workspacesByRepo[repoId] = list.filter((w) => w.id !== id);
        }
        if (s.activeWorkspaceId === id) {
          s.activeWorkspaceId = null;
        }
      });
    },

    setActiveWorkspace: (id) => {
      set((s) => {
        s.activeWorkspaceId = id;
      });
    },

    updateWorkspaceStatus: (workspaceId, status) => {
      set((s) => {
        for (const list of Object.values(s.workspacesByRepo)) {
          const ws = (list as Workspace[]).find((w) => w.id === workspaceId);
          if (ws) {
            ws.status = status as Workspace["status"];
            break;
          }
        }
      });
    },

    getActiveWorkspace: () => {
      const { activeWorkspaceId, workspacesByRepo } = get();
      if (!activeWorkspaceId) return undefined;
      for (const list of Object.values(workspacesByRepo)) {
        const ws = list.find((w) => w.id === activeWorkspaceId);
        if (ws) return ws;
      }
      return undefined;
    },

    getRepoList: () => {
      const { repos, workspacesByRepo } = get();
      return repos.map((repo) => ({
        repo,
        workspaces: workspacesByRepo[repo.id] ?? [],
        isExpanded: true,
      }));
    },
  })),
);
