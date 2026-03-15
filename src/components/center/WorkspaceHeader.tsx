import { ChevronDown, Code2, DollarSign, GitBranch, GitPullRequest, History, PanelRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { fadeInDown, springs } from "@/lib/animations";

interface WorkspaceHeaderProps {
  workspaceId: string | null;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
}

export function WorkspaceHeader({ workspaceId, showRightPanel, onToggleRightPanel }: WorkspaceHeaderProps) {
  const { repos, workspacesByRepo } = useWorkspaceStore();

  if (!workspaceId) return null;

  // Find workspace and its repo
  let workspace = undefined;
  let repo = undefined;
  for (const r of repos) {
    const ws = workspacesByRepo[r.id]?.find((w) => w.id === workspaceId);
    if (ws) {
      workspace = ws;
      repo = r;
      break;
    }
  }

  if (!workspace || !repo) return null;

  const targetBranch = repo.default_branch;
  const costLabel = `$${workspace.total_cost_usd.toFixed(2)}`;

  return (
    <motion.div
      {...fadeInDown}
      className="flex h-[35px] shrink-0 items-center gap-2 px-3"
      style={{
        backgroundColor: "var(--vscode-tab-bar-background)",
        borderBottom: "1px solid var(--vscode-tab-border)",
      }}
    >
      {/* Repo + branch breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-1 text-[12px]">
        <motion.button
          type="button"
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="max-w-[120px] truncate rounded-md px-1.5 py-0.5 font-medium"
          style={{ color: "var(--vscode-tab-active-foreground)" }}
        >
          {repo.name}
        </motion.button>

        <span style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.3 }}>/</span>

        <motion.button
          type="button"
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5",
          )}
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          <GitBranch className="h-3 w-3 shrink-0" />
          <span className="max-w-[120px] truncate">{workspace.branch_name}</span>
          <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-50" />
        </motion.button>

        <span
          className="text-[10px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.3 }}
        >
          &rarr;
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
        <motion.button
          type="button"
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={springs.snappy}
          className="flex h-[24px] w-[24px] items-center justify-center rounded-md"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
          title="Conversation history"
        >
          <History className="h-3.5 w-3.5" />
        </motion.button>

        {/* Toggle right panel */}
        {onToggleRightPanel && (
          <motion.button
            type="button"
            onClick={onToggleRightPanel}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-md"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: showRightPanel ? 1 : 0.4 }}
            title="Toggle right panel"
          >
            <PanelRight className="h-3.5 w-3.5" />
          </motion.button>
        )}

        {/* Token cost */}
        <motion.span
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={springs.snappy}
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
        </motion.span>

        {/* Create PR split button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={springs.snappy}
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
        </motion.div>

        {/* Open in IDE split button */}
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={springs.snappy}
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
        </motion.div>
      </div>
    </motion.div>
  );
}
