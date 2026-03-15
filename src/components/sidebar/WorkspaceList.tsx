import { useCallback, useEffect, useState } from "react";
import { ChevronRight, FolderOpen, ListFilter, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { WorkspaceItem } from "./WorkspaceItem";
import { NewWorkspaceModal } from "./NewWorkspaceModal";
import { staggerContainer, staggerItem, fadeInUp, springs, collapseVertical } from "@/lib/animations";
import type { Repository, Workspace } from "@/types/workspace";

interface WorkspaceListProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

function RepoGroup({
  repo,
  workspaces,
  defaultExpanded,
  activeWorkspaceId,
  onWorkspaceSelect,
}: {
  repo: Repository;
  workspaces: Workspace[];
  defaultExpanded: boolean;
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const hasWorkspaces = workspaces.length > 0;

  return (
    <motion.div variants={staggerItem}>
      <button
        type="button"
        onClick={() => hasWorkspaces && setIsExpanded((e) => !e)}
        className={cn(
          "vscode-list-item flex h-[22px] w-full items-center gap-1 text-left text-[11px] font-semibold uppercase tracking-wider transition-colors duration-75",
          !hasWorkspaces && "cursor-default",
        )}
        style={{ paddingLeft: 12, color: "var(--vscode-sidebar-section-header-foreground)" }}
      >
        {hasWorkspaces && (
          <motion.span
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={springs.snappy}
          >
            <ChevronRight
              className="h-3 w-3 shrink-0"
              style={{ opacity: 0.7 }}
            />
          </motion.span>
        )}
        {!hasWorkspaces && <div className="w-3 shrink-0" />}
        <span className="min-w-0 flex-1 truncate">{repo.name}</span>
        {hasWorkspaces && (
          <span className="mr-2 text-[10px] font-normal opacity-50">
            {workspaces.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isExpanded && hasWorkspaces && (
          <motion.div
            variants={collapseVertical}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="mt-px"
          >
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {workspaces.map((ws) => (
                <motion.div key={ws.id} variants={staggerItem}>
                  <WorkspaceItem
                    workspace={ws}
                    isActive={ws.id === activeWorkspaceId}
                    onClick={() => onWorkspaceSelect(ws.id)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function WorkspaceList({ activeWorkspaceId, onWorkspaceSelect }: WorkspaceListProps) {
  const { repos, workspacesByRepo, loading, error, fetchAll } = useWorkspaceStore();
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleOpenModal = useCallback(() => setModalOpen(true), []);

  const repoList = repos.map((repo) => ({
    repo,
    workspaces: workspacesByRepo[repo.id] ?? [],
  }));

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex h-[28px] items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border, transparent)" }}
      >
        <span className="vscode-sidebar-title">Workspaces</span>
        <div className="flex items-center gap-0.5">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="vscode-list-item flex h-[20px] w-[20px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="Filter workspaces"
          >
            <ListFilter className="h-3 w-3" />
          </motion.button>
          <motion.button
            type="button"
            onClick={handleOpenModal}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="vscode-list-item flex h-[20px] w-[20px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="New workspace"
            title="New workspace"
          >
            <Plus className="h-3 w-3" />
          </motion.button>
        </div>
      </motion.div>

      {/* Loading state with skeleton */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2 px-4 py-3"
          >
            <div className="skeleton h-3 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
            <div className="skeleton h-3 w-2/3" />
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <motion.div
          {...fadeInUp}
          className="px-4 py-3 text-[12px]"
          style={{ color: "#f48771" }}
        >
          {error}
        </motion.div>
      )}

      {/* Empty state */}
      <AnimatePresence>
        {!loading && !error && repoList.length === 0 && (
          <motion.button
            type="button"
            onClick={handleOpenModal}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.05)" }}
            whileTap={{ scale: 0.98 }}
            transition={springs.smooth}
            className="mx-3 mt-3 flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-6 text-center"
            style={{
              borderColor: "var(--vscode-sidebar-section-header-border)",
              color: "var(--vscode-tab-inactive-foreground)",
            }}
          >
            <FolderOpen className="h-6 w-6 opacity-50" />
            <span className="text-[12px]">Create or import a workspace</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Repo groups */}
      {!loading && (
        <motion.div
          className="mt-1 space-y-2"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {repoList.map(({ repo, workspaces }) => (
            <RepoGroup
              key={repo.id}
              repo={repo}
              workspaces={workspaces}
              defaultExpanded={true}
              activeWorkspaceId={activeWorkspaceId}
              onWorkspaceSelect={onWorkspaceSelect}
            />
          ))}
        </motion.div>
      )}

      <NewWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onWorkspaceSelect={onWorkspaceSelect}
      />
    </div>
  );
}
