import { GitBranch } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/workspace";
import { springs } from "@/lib/animations";

const statusColors: Record<string, string> = {
  running: "#4ec994",
  waiting: "#cca700",
  needs_review: "#3b9edd",
  idle: "var(--vscode-tab-inactive-foreground)",
  error: "#f48771",
  blocked: "#f48771",
  archived: "var(--vscode-tab-inactive-foreground)",
};

const animatedStatuses = new Set(["running", "waiting"]);

interface WorkspaceItemProps {
  workspace: Workspace;
  isActive: boolean;
  onClick: () => void;
}

export function WorkspaceItem({ workspace, isActive, onClick }: WorkspaceItemProps) {
  const dotColor = statusColors[workspace.status] ?? statusColors.idle;
  const shouldPulse = animatedStatuses.has(workspace.status);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ x: 2, backgroundColor: "var(--vscode-list-hover-background)" }}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      className={cn(
        "vscode-list-item vscode-sidebar-item vscode-focusable group flex h-[22px] w-full items-center gap-1.5 text-left text-[13px]",
        isActive && "selected",
      )}
      style={{ paddingLeft: 24 }}
    >
      <GitBranch
        className="h-3.5 w-3.5 shrink-0"
        style={{ color: isActive ? "var(--vscode-list-active-selection-foreground)" : "var(--vscode-list-tree-indent-guide-stroke)" }}
      />
      <span className="min-w-0 flex-1 truncate">{workspace.city_name}</span>
      <span
        className={cn(
          "status-dot mr-2 inline-block h-[6px] w-[6px] shrink-0 rounded-full",
          shouldPulse && "status-dot-active",
        )}
        style={{ backgroundColor: dotColor }}
      />
    </motion.button>
  );
}
