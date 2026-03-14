import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/workspace";

const statusColors: Record<string, string> = {
  running: "#4ec994",
  waiting: "#cca700",
  needs_review: "#3b9edd",
  idle: "var(--vscode-tab-inactive-foreground)",
  error: "#f48771",
  blocked: "#f48771",
  archived: "var(--vscode-tab-inactive-foreground)",
};

interface WorkspaceItemProps {
  workspace: Workspace;
  isActive: boolean;
  onClick: () => void;
}

export function WorkspaceItem({ workspace, isActive, onClick }: WorkspaceItemProps) {
  const dotColor = statusColors[workspace.status] ?? statusColors.idle;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "vscode-list-item vscode-sidebar-item vscode-focusable group flex h-[22px] w-full items-center gap-1.5 text-left text-[13px] transition-colors duration-75",
        isActive && "selected",
      )}
      style={{ paddingLeft: 24 }}
    >
      <GitBranch
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: isActive ? "var(--vscode-list-active-selection-foreground)" : "var(--vscode-list-tree-indent-guide-stroke)" }}
      />
      <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
      <span
        className="mr-2 inline-block h-[6px] w-[6px] shrink-0 rounded-full"
        style={{ backgroundColor: dotColor }}
      />
    </button>
  );
}
