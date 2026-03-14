import { useState } from "react";
import { SidebarNav } from "@/components/sidebar/SidebarNav";
import { WorkspaceList } from "@/components/sidebar/WorkspaceList";
import { HelpCircle, Settings } from "lucide-react";

interface SidebarLayoutProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

export function SidebarLayout({ activeWorkspaceId, onWorkspaceSelect }: SidebarLayoutProps) {
  const [activeSection, setActiveSection] = useState<"activity" | "workspaces">("activity");

  return (
    <aside className="vscode-sidebar flex h-full w-[240px] shrink-0 flex-col">
      {/* Top navigation */}
      <SidebarNav activeSection={activeSection} onSectionChange={setActiveSection} />

      {/* Divider */}
      <div className="mx-3" style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border)" }} />

      {/* Scrollable workspace list */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1.5">
        <WorkspaceList
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={onWorkspaceSelect}
        />
      </div>

      {/* Bottom actions */}
      <div className="mx-3" style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border)" }} />
      <div className="flex shrink-0 items-center gap-1 px-2 py-1.5">
        <button
          type="button"
          className="vscode-list-item flex h-7 w-7 items-center justify-center rounded transition-colors duration-75"
          style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="vscode-list-item flex h-7 w-7 items-center justify-center rounded transition-colors duration-75"
          style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
          aria-label="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}
