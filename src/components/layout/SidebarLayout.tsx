import { useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { SidebarNav, type SidebarNavItemId } from "@/components/sidebar/SidebarNav";
import { WorkspaceList } from "@/components/sidebar/WorkspaceList";
import { ResizeHandle } from "@/components/shared/ResizeHandle";
import { springs } from "@/lib/animations";

const DEFAULT_SIDEBAR_WIDTH = 220;
const MIN_SIDEBAR_WIDTH = 150;
const MAX_SIDEBAR_WIDTH = 480;

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
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const isFullPage = FULL_PAGE_ITEMS.includes(activeItem);

  return (
    <LayoutGroup>
      <div className="flex h-full shrink-0">
        <SidebarNav activeItem={activeItem} onItemChange={onItemChange} />

        {!isFullPage && (
          <>
            <motion.aside
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.smooth, delay: 0.08 }}
              className="vscode-sidebar flex h-full shrink-0 flex-col"
              style={{ width: sidebarWidth }}
            >
              <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1.5">
                <WorkspaceList
                  activeWorkspaceId={activeWorkspaceId}
                  onWorkspaceSelect={onWorkspaceSelect}
                />
              </div>
            </motion.aside>

            <ResizeHandle
              currentSize={sidebarWidth}
              onResize={setSidebarWidth}
              minSize={MIN_SIDEBAR_WIDTH}
              maxSize={MAX_SIDEBAR_WIDTH}
              direction="left"
              defaultSize={DEFAULT_SIDEBAR_WIDTH}
            />
          </>
        )}
      </div>
    </LayoutGroup>
  );
}
