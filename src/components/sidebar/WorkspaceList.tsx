import { useState } from "react";
import { ChevronRight, Link2, ListFilter, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { mockRepos } from "@/data/mockWorkspaces";
import { WorkspaceItem } from "./WorkspaceItem";
import type { Repo } from "@/types/workspace";

interface WorkspaceListProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

function RepoAvatar({ repo }: { repo: Repo }) {
  if (repo.iconVariant === "chain") {
    return (
      <span
        className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded text-white"
        style={{ background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}
      >
        <Link2 className="h-2.5 w-2.5" />
      </span>
    );
  }

  return (
    <span
      className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded text-[11px] font-semibold"
      style={{
        backgroundColor: "var(--vscode-list-inactive-selection-background)",
        color: "var(--vscode-sidebar-foreground)",
      }}
    >
      {repo.avatarLetter}
    </span>
  );
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
    <div className="mb-0.5">
      {/* Repo header */}
      <button
        type="button"
        onClick={() => hasWorkspaces && setIsExpanded((e) => !e)}
        className={cn(
          "vscode-list-item flex w-full items-center gap-2 px-3 py-[5px] text-left text-[13px] transition-colors duration-75",
          !hasWorkspaces && "cursor-default",
        )}
      >
        {hasWorkspaces && (
          <ChevronRight
            className={cn("h-3 w-3 shrink-0 transition-transform duration-150", isExpanded && "rotate-90")}
            style={{ color: "var(--vscode-sidebar-section-header-foreground)", opacity: 0.6 }}
          />
        )}
        {!hasWorkspaces && <div className="w-3 shrink-0" />}
        <RepoAvatar repo={repo} />
        <span className="min-w-0 flex-1 truncate font-medium" style={{ color: "var(--vscode-sidebar-foreground)" }}>
          {repo.name}
        </span>
      </button>

      {/* Workspace rows */}
      {isExpanded && hasWorkspaces && (
        <div className="ml-[28px] pl-[12px]" style={{ borderLeft: "1px solid var(--vscode-list-indent-guide)" }}>
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
  return (
    <div className="flex flex-col">
      {/* Section header */}
      <div className="flex items-center justify-between px-3 py-1">
        <span className="vscode-sidebar-title">Workspaces</span>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            className="vscode-list-item flex h-[22px] w-[22px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="Filter workspaces"
          >
            <ListFilter className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            className="vscode-list-item flex h-[22px] w-[22px] items-center justify-center rounded transition-colors duration-75"
            style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
            aria-label="New workspace"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Repo groups */}
      <div className="mt-0.5">
        {mockRepos.map((repo) => (
          <RepoGroup
            key={repo.id}
            repo={repo}
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceSelect={onWorkspaceSelect}
          />
        ))}
      </div>
    </div>
  );
}
