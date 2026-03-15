import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { CenterPanel, type CenterPanelHandle } from "@/components/center/CenterPanel";
import { RightPanel } from "@/components/panels/RightPanel";
import { BottomPanel } from "@/components/panels/BottomPanel";
import { ResizeHandle } from "@/components/shared/ResizeHandle";
import { PreferencesPage } from "@/pages/PreferencesPage";
import { HelpPage } from "@/pages/HelpPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { AutomationsPage } from "@/pages/AutomationsPage";
import { SkillsPage } from "@/pages/SkillsPage";
import { type SidebarNavItemId } from "@/components/sidebar/SidebarNav";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useSettingsStore } from "@/store/settingsStore";

const DEFAULT_RIGHT_WIDTH = 360;
const MIN_RIGHT_WIDTH = 260;
const MAX_RIGHT_WIDTH = 700;

const FULL_PAGE_ITEMS: SidebarNavItemId[] = ["preferences", "help", "settings", "automations", "skills"];

function App() {
  const { activeWorkspaceId, setActiveWorkspace, getActiveWorkspace } = useWorkspaceStore();
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeItem, setActiveItem] = useState<SidebarNavItemId>("new-chat");
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_WIDTH);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const handleSectionOpen = useCallback((section: string) => {
    setActiveSection((prev) => (prev === section ? null : section));
  }, []);
  const [activeRepoId, setActiveRepoId] = useState<string | null>(null);
  const centerRef = useRef<CenterPanelHandle>(null);

  // Load settings store on mount (repos are loaded by WorkspaceList via fetchAll)
  useEffect(() => {
    void useSettingsStore.getState().loadSettings();
  }, []);

  const activeWs = getActiveWorkspace();
  const isFullPage = FULL_PAGE_ITEMS.includes(activeItem);

  const handleWorkspaceSelect = useCallback(
    (id: string) => {
      setActiveWorkspace(id);
      setActiveRepoId(null);
    },
    [setActiveWorkspace],
  );

  const handleNewChatForRepo = useCallback(
    (repoId: string) => {
      setActiveRepoId(repoId);
      setActiveWorkspace(null);
      centerRef.current?.openNewChatForRepo(repoId);
    },
    [setActiveWorkspace],
  );

  const handleWorkspaceCreated = useCallback(
    (wsId: string) => {
      setActiveWorkspace(wsId);
      setActiveRepoId(null);
    },
    [setActiveWorkspace],
  );

  return (
    <div className="vscode-editor flex h-screen flex-col overflow-hidden">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        <SidebarLayout
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={handleWorkspaceSelect}
          onNewChatForRepo={handleNewChatForRepo}
          activeItem={activeItem}
          onItemChange={setActiveItem}
        />

        {isFullPage ? (
          <div className="flex min-w-0 flex-1">
            {activeItem === "preferences" && <PreferencesPage />}
            {activeItem === "help" && <HelpPage />}
            {activeItem === "settings" && <SettingsPage />}
            {activeItem === "automations" && <AutomationsPage />}
            {activeItem === "skills" && <SkillsPage />}
          </div>
        ) : (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <CenterPanel
                ref={centerRef}
                workspaceId={activeWorkspaceId}
                repoId={activeRepoId}
                showRightPanel={showRightPanel}
                onToggleRightPanel={() => setShowRightPanel((v) => !v)}
                onWorkspaceCreated={handleWorkspaceCreated}
              />
            </div>

            {showRightPanel && (
              <ResizeHandle
                currentSize={rightPanelWidth}
                onResize={setRightPanelWidth}
                minSize={MIN_RIGHT_WIDTH}
                maxSize={MAX_RIGHT_WIDTH}
                direction="right"
                defaultSize={DEFAULT_RIGHT_WIDTH}
              />
            )}

            <AnimatePresence mode="wait">
              {showRightPanel && (
                <motion.div
                  key="right-panel"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: rightPanelWidth, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                  className="flex shrink-0 flex-col overflow-hidden"
                >
                  <div
                    className="vscode-scrollable h-full overflow-y-auto"
                    style={{ backgroundColor: "var(--vscode-sideBar-background)" }}
                  >
                    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--vscode-sideBar-background)" }}>
                      <RightPanel
                        worktreePath={activeWs?.worktree_path}
                        onOpenFile={(filename, filePath) =>
                          centerRef.current?.openFile(filename, filePath)
                        }
                        activeSection={activeSection}
                        onSectionOpen={handleSectionOpen}
                      />
                      <BottomPanel
                        worktreePath={activeWs?.worktree_path}
                        activeSection={activeSection}
                        onSectionOpen={handleSectionOpen}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

    </div>
  );
}

export default App;
