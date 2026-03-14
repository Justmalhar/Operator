import { useState } from "react";
import { SidebarNav, type SidebarNavItemId } from "@/components/sidebar/SidebarNav";
import { WorkspaceList } from "@/components/sidebar/WorkspaceList";

interface SidebarLayoutProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
}

export function SidebarLayout({ activeWorkspaceId, onWorkspaceSelect }: SidebarLayoutProps) {
  const [activeItem, setActiveItem] = useState<SidebarNavItemId>("activity");

  return (
    <div className="flex h-full shrink-0">
      <SidebarNav activeItem={activeItem} onItemChange={setActiveItem} />

      <aside className="vscode-sidebar flex h-full w-[220px] shrink-0 flex-col">
        <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1.5">
          <WorkspaceList
            activeWorkspaceId={activeWorkspaceId}
            onWorkspaceSelect={onWorkspaceSelect}
          />
        </div>
      </aside>
    </div>
  );
}
