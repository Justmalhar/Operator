import { useState } from "react";
import { ChevronRight, ListFilter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { WorkspaceItem } from "./WorkspaceItem";
import { NewWorkspaceModal } from "./NewWorkspaceModal";
import type { Repo } from "@/types/workspace";

interface WorkspaceListProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

function RepoGroup({
  repo,
  activeWorkspaceId,
  onWorkspaceSelect,
}: {
  repo: Repo;
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (id: string) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(repo.isExpanded ?? true);
  const hasWorkspaces = repo.workspaces.length > 0;

  return (
    <div>
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
          <ChevronRight
            className={cn("h-3 w-3 shrink-0 transition-transform duration-150", isExpanded && "rotate-90")}
            style={{ opacity: 0.7 }}
          />
        )}
        {!hasWorkspaces && <div className="w-3 shrink-0" />}
        <span className="min-w-0 flex-1 truncate">{repo.name}</span>
        {hasWorkspaces && (
          <span className="mr-2 text-[10px] font-normal opacity-50">
            {repo.workspaces.length}
          </span>
        )}
      </button>

      {isExpanded && hasWorkspaces && (
        <div className="mt-px">
          {repo.workspaces.map((ws) => (
            <WorkspaceItem
              key={ws.id}
              workspace={ws}
              isActive={ws.id === activeWorkspaceId}
              onClick={() => onWorkspaceSelect(ws.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function WorkspaceList({ activeWorkspaceId, onWorkspaceSelect }: WorkspaceListProps) {
  const repos = useWorkspaceStore((s) => s.repos);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex flex-col">
      {/* Section header */}
      <div
        className="flex h-[28px] items-center justify-between px-3"
        style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border, transparent)" }}
      >
        <span className="vscode-sidebar-title">Workspaces</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="vscode-list-item flex h-[20px] w-[20px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="Filter workspaces"
          >
            <ListFilter className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="vscode-list-item flex h-[20px] w-[20px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="New workspace"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Repo groups */}
      <div className="mt-1 space-y-2">
        {repos.map((repo) => (
          <RepoGroup
            key={repo.id}
            repo={repo}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceSelect={onWorkspaceSelect}
          />
        ))}
      </div>

      <NewWorkspaceModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onWorkspaceSelect={onWorkspaceSelect}
      />
    </div>
  );
}
