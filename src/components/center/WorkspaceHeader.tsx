import { ChevronDown, Code2, DollarSign, GitBranch, GitPullRequest, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockRepos } from "@/data/mockWorkspaces";
import type { Repo, Workspace } from "@/types/workspace";

interface WorkspaceHeaderProps {
  workspaceId: string | null;
}

function findWorkspace(id: string): { workspace: Workspace; repo: Repo } | null {
  for (const repo of mockRepos) {
    const workspace = repo.workspaces.find((ws) => ws.id === id);
    if (workspace) return { workspace, repo };
  }
  return null;
}

export function WorkspaceHeader({ workspaceId }: WorkspaceHeaderProps) {
  if (!workspaceId) return null;

  const found = findWorkspace(workspaceId);
  if (!found) return null;

  const { workspace, repo } = found;
  const targetBranch = "main";
  const costLabel =
    workspace.cost != null ? `$${workspace.cost.toFixed(2)}` : "$0.24";

  return (
    <div
      className="flex h-[35px] shrink-0 items-center gap-2 px-3"
      style={{
        backgroundColor: "var(--vscode-tab-bar-background)",
        borderBottom: "1px solid var(--vscode-tab-border)",
      }}
    >
      {/* Repo + branch breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-1 text-[12px]">
        <button
          type="button"
          className="max-w-[120px] truncate rounded-md px-1.5 py-0.5 font-medium transition-colors duration-75 hover:bg-white/5"
          style={{ color: "var(--vscode-tab-active-foreground)" }}
        >
          {repo.name}
        </button>

        <span style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.3 }}>/</span>

        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors duration-75 hover:bg-white/5",
          )}
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          <GitBranch className="h-3 w-3 shrink-0" />
          <span className="max-w-[120px] truncate">{workspace.branch}</span>
          <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-50" />
        </button>

        <span
          className="text-[10px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.3 }}
        >
          →
        </span>

        <span
          className="truncate text-[11px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.45 }}
        >
          {targetBranch}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Conversation history */}
        <button
          type="button"
          className="flex h-[24px] w-[24px] items-center justify-center rounded-md transition-colors duration-75 hover:bg-white/5"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
          title="Conversation history"
        >
          <History className="h-3.5 w-3.5" />
        </button>

        {/* Token cost */}
        <span
          className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.06))",
            color: "var(--vscode-tab-inactive-foreground)",
            opacity: 0.7,
          }}
        >
          <DollarSign className="h-3 w-3" />
          {costLabel.replace("$", "")}
        </span>

        {/* Create PR split button */}
        <div
          className="flex items-stretch overflow-hidden rounded-md"
          style={{ border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.08))" }}
        >
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-colors duration-75 hover:bg-white/5"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          >
            <GitPullRequest className="h-3 w-3 shrink-0" />
            Create PR
          </button>
          <div style={{ width: "1px", backgroundColor: "var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.08))" }} />
          <button
            type="button"
            className="flex items-center px-1.5 py-1 transition-colors duration-75 hover:bg-white/5"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
            title="PR options"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>

        {/* Open in IDE split button */}
        <div
          className="flex items-stretch overflow-hidden rounded-md"
          style={{ border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.08))" }}
        >
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-colors duration-75 hover:bg-white/5"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          >
            <Code2 className="h-3 w-3 shrink-0" />
            Open
          </button>
          <div style={{ width: "1px", backgroundColor: "var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.08))" }} />
          <button
            type="button"
            className="flex items-center px-1.5 py-1 transition-colors duration-75 hover:bg-white/5"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
            title="IDE options"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
