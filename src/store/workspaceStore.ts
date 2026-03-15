import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { Repo, Workspace, WorkspaceStatus } from "@/types/workspace";

// ── Tauri DB types (snake_case from Rust) ────────────────────────────────────

interface TauriRepository {
  id: string;
  name: string;
  full_name: string;
  remote_url: string;
  local_path: string;
  default_branch: string;
}

interface TauriWorkspace {
  id: string;
  repository_id: string;
  city_name: string;
  branch_name: string;
  worktree_path: string;
  status: string;
  total_cost_usd: number;
  is_archived: number;
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface WorkspaceStore {
  repos: Repo[];
  isLoading: boolean;
  loadRepos: () => Promise<void>;
  addRepo: (repo: Repo) => void;
}

function mapWorkspace(ws: TauriWorkspace): Workspace {
  return {
    id: ws.id,
    name: ws.city_name,
    branch: ws.branch_name,
    status: (ws.status as WorkspaceStatus) ?? "idle",
    agentCount: 0,
    cost: ws.total_cost_usd > 0 ? ws.total_cost_usd : undefined,
    localPath: ws.worktree_path,
  };
}

function mapRepo(repo: TauriRepository, workspaces: TauriWorkspace[]): Repo {
  const repoWorkspaces = workspaces
    .filter((ws) => ws.repository_id === repo.id && ws.is_archived === 0)
    .map(mapWorkspace);

  return {
    id: repo.id,
    name: repo.name,
    avatarLetter: repo.name.charAt(0).toUpperCase(),
    workspaces: repoWorkspaces,
    isExpanded: repoWorkspaces.length > 0,
  };
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  repos: [],
  isLoading: false,

  loadRepos: async () => {
    set({ isLoading: true });
    try {
      const tauriRepos = await invoke<TauriRepository[]>("list_repositories");
      const allWorkspaces: TauriWorkspace[] = [];

      for (const repo of tauriRepos) {
        const ws = await invoke<TauriWorkspace[]>("list_workspaces", {
          repositoryId: repo.id,
        });
        allWorkspaces.push(...ws);
      }

      const repos = tauriRepos.map((r) => mapRepo(r, allWorkspaces));
      set({ repos, isLoading: false });
    } catch (err) {
      console.error("Failed to load repos:", err);
      set({ isLoading: false });
    }
  },

  addRepo: (repo) => {
    set((state) => ({ repos: [...state.repos, repo] }));
  },
}));
