import { useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { SidebarNav, type SidebarNavItemId } from "@/components/sidebar/SidebarNav";
import { WorkspaceList } from "@/components/sidebar/WorkspaceList";
import { ResizeHandle } from "@/components/shared/ResizeHandle";

const DEFAULT_SIDEBAR_WIDTH = 220;
const MIN_SIDEBAR_WIDTH = 150;
const MAX_SIDEBAR_WIDTH = 480;

const FULL_PAGE_ITEMS: SidebarNavItemId[] = ["preferences", "help", "settings", "automations", "skills"];

interface SidebarLayoutProps {
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
  onNewChatForRepo?: (repoId: string) => void;
  activeItem: SidebarNavItemId;
  onItemChange: (item: SidebarNavItemId) => void;
}

export function SidebarLayout({
  activeWorkspaceId,
  onWorkspaceSelect,
  onNewChatForRepo,
  activeItem,
  onItemChange,
}: SidebarLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [showSidebar, setShowSidebar] = useState(true);
  const isFullPage = FULL_PAGE_ITEMS.includes(activeItem);

  return (
    <LayoutGroup>
      <div className="flex h-full shrink-0">
        <SidebarNav
          activeItem={activeItem}
          onItemChange={onItemChange}
          sidebarVisible={showSidebar}
          onToggleSidebar={!isFullPage ? () => setShowSidebar((v) => !v) : undefined}
        />

        {!isFullPage && (
          <AnimatePresence initial={false}>
            {showSidebar && (
              <>
                <motion.aside
                  key="sidebar-panel"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: sidebarWidth, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="vscode-sidebar flex h-full shrink-0 flex-col overflow-hidden"
                >
                  <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1.5" style={{ width: sidebarWidth }}>
                    <WorkspaceList
                      activeWorkspaceId={activeWorkspaceId}
                      onWorkspaceSelect={onWorkspaceSelect}
                      onNewChatForRepo={onNewChatForRepo}
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
          </AnimatePresence>
        )}
      </div>
    </LayoutGroup>
  );
}
