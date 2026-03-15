export type WorkspaceStatus =
  | "running"      // ● green pulse
  | "waiting"      // ● amber pulse
  | "needs_review" // ✓ blue
  | "idle"         // ○ grey
  | "error"        // ● red
  | "blocked"      // ⚠ amber
  | "archived";    // dim text

export type AgentBackend = "claude" | "codex" | "gemini" | "cursor" | "opencode";

export type Platform = "github" | "gitlab" | "bitbucket" | "azure_devops";

/** Matches the Rust db::repository::Repository struct. */
export interface Repository {
  id: string;
  name: string;
  full_name: string;
  remote_url: string;
  local_path: string;
  platform: Platform;
  default_branch: string;
  icon_path: string | null;
  operator_json: string | null;
  last_synced: string | null;
  created_at: string;
  updated_at: string;
}

/** Payload for creating a repository via add_repository. */
export interface CreateRepository {
  name: string;
  full_name: string;
  remote_url: string;
  local_path: string;
  platform?: Platform;
  default_branch?: string;
  icon_path?: string;
  operator_json?: string;
}

/** Matches the Rust db::workspace::Workspace struct. */
export interface Workspace {
  id: string;
  repository_id: string;
  city_name: string;
  branch_name: string;
  worktree_path: string;
  status: WorkspaceStatus;
  agent_backend: AgentBackend;
  model: string | null;
  reasoning_level: string | null;
  port_base: number | null;
  pr_url: string | null;
  pr_number: number | null;
  total_cost_usd: number;
  total_tokens: number;
  is_archived: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Convenience view model for sidebar display. */
export interface RepoWithWorkspaces {
  repo: Repository;
  workspaces: Workspace[];
  isExpanded: boolean;
}
