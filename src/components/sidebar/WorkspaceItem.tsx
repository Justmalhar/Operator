import { GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/workspace";

interface WorkspaceItemProps {
  workspace: Workspace;
  isActive: boolean;
  onClick: () => void;
}

export function WorkspaceItem({ workspace, isActive, onClick }: WorkspaceItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "vscode-list-item vscode-focusable flex w-full items-center gap-2 rounded px-2 py-[4px] text-left text-[13px] transition-colors duration-75",
        isActive && "selected",
      )}
    >
      <GitBranch className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--vscode-list-tree-indent-guide-stroke)" }} />
      <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
      {workspace.agentCount > 0 && (
        <span className="vscode-badge shrink-0 rounded-full px-1.5 py-px text-[10px] font-semibold leading-none">
          {workspace.agentCount}
        </span>
      )}
    </button>
  );
}
