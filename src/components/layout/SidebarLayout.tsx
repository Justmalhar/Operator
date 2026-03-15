import { SidebarNav, type SidebarNavItemId } from "@/components/sidebar/SidebarNav";
import { WorkspaceList } from "@/components/sidebar/WorkspaceList";

const FULL_PAGE_ITEMS: SidebarNavItemId[] = ["preferences", "help", "settings"];

interface SidebarLayoutProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
  activeItem: SidebarNavItemId;
  onItemChange: (item: SidebarNavItemId) => void;
}

export function SidebarLayout({
  activeWorkspaceId,
  onWorkspaceSelect,
  activeItem,
  onItemChange,
}: SidebarLayoutProps) {
  const isFullPage = FULL_PAGE_ITEMS.includes(activeItem);

  return (
    <div className="flex h-full shrink-0">
      <SidebarNav activeItem={activeItem} onItemChange={onItemChange} />

      {!isFullPage && (
        <aside className="vscode-sidebar flex h-full w-[220px] shrink-0 flex-col">
          <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1.5">
            <WorkspaceList
              activeWorkspaceId={activeWorkspaceId}
              onWorkspaceSelect={onWorkspaceSelect}
            />
          </div>
        </aside>
      )}
    </div>
  );
}
