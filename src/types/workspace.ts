export type WorkspaceStatus =
  | "running"      // ● green pulse
  | "waiting"      // ● amber pulse
  | "needs_review" // ✓ blue
  | "idle"         // ○ grey
  | "error"        // ● red
  | "blocked"      // ⚠ amber
  | "archived";    // dim text

export interface Workspace {
  id: string;
  name: string;
  branch: string;
  status: WorkspaceStatus;
  agentCount: number;
  cost?: number;
  todoCount?: number;
  localPath?: string;
}

export interface Repo {
  id: string;
  name: string;
  /** Single letter or emoji shown as avatar */
  avatarLetter: string;
  /** Optional custom icon variant: 'chain' = Operator icon */
  iconVariant?: "chain";
  workspaces: Workspace[];
  isExpanded?: boolean;
}
