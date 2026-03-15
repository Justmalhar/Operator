import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";
import { cn } from "@/lib/utils";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { CenterPanel, type CenterPanelHandle } from "@/components/center/CenterPanel";
import { RightPanel } from "@/components/panels/RightPanel";
import { BottomPanel } from "@/components/panels/BottomPanel";
import { ResizeHandle } from "@/components/shared/ResizeHandle";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { springs } from "@/lib/animations";
import {
  AlertCircle,
  CheckCircle2,
  Cloud,
  GitBranch,
  PanelRight,
  Radio,
  Wifi,
} from "lucide-react";

const DEFAULT_RIGHT_WIDTH = 360;
const MIN_RIGHT_WIDTH = 260;
const MAX_RIGHT_WIDTH = 700;
const DEFAULT_BOTTOM_HEIGHT = 260;
const MIN_BOTTOM_HEIGHT = 100;
const MAX_BOTTOM_HEIGHT = 500;

function App() {
  const { activeWorkspaceId, setActiveWorkspace, getActiveWorkspace } = useWorkspaceStore();
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(DEFAULT_RIGHT_WIDTH);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(DEFAULT_BOTTOM_HEIGHT);
  const centerRef = useRef<CenterPanelHandle>(null);

  const activeWs = getActiveWorkspace();

  const handleWorkspaceSelect = useCallback(
    (id: string) => setActiveWorkspace(id),
    [setActiveWorkspace],
  );

  return (
    <div className="vscode-editor flex h-screen flex-col overflow-hidden">
      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        <SidebarLayout
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={handleWorkspaceSelect}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <CenterPanel ref={centerRef} workspaceId={activeWorkspaceId} showRightPanel={showRightPanel} onToggleRightPanel={() => setShowRightPanel((v) => !v)} />
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
              <div className="min-h-0 flex-1">
                <RightPanel
                  worktreePath={activeWs?.worktree_path}
                  onOpenFile={(filename, filePath) =>
                    centerRef.current?.openFile(filename, filePath)
                  }
                />
              </div>

              {/* Horizontal resize handle between right panel and bottom panel */}
              <ResizeHandle
                currentSize={bottomPanelHeight}
                onResize={setBottomPanelHeight}
                minSize={MIN_BOTTOM_HEIGHT}
                maxSize={MAX_BOTTOM_HEIGHT}
                direction="right"
                orientation="horizontal"
                defaultSize={DEFAULT_BOTTOM_HEIGHT}
              />

              <div style={{ height: bottomPanelHeight }} className="shrink-0">
                <BottomPanel worktreePath={activeWs?.worktree_path} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Status bar — rich IDE-grade ───────────────────────────────────── */}
      <motion.div
        initial={{ y: 22 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, ...springs.smooth }}
        className="vscode-statusbar flex h-[22px] shrink-0 items-center justify-between text-[11px]"
      >
        <div className="flex min-w-0 flex-1 items-center overflow-hidden">
          <button
            type="button"
            className="statusbar-item-interactive flex shrink-0 items-center gap-1.5 px-2"
            style={{
              background: "linear-gradient(135deg, #16825d, #1a9f6e)",
              color: "#fff",
            }}
          >
            <Radio className="h-3 w-3" />
            <span className="font-medium">Operator</span>
          </button>

          <button
            type="button"
            className="statusbar-item-interactive flex items-center gap-1 truncate px-2"
          >
            <GitBranch className="h-3 w-3 shrink-0" />
            <span className="truncate">{activeWs?.branch_name ?? "main"}</span>
          </button>

          <button
            type="button"
            className="statusbar-item-interactive hidden items-center gap-1 px-2 sm:flex"
          >
            <Cloud className="h-3 w-3" />
          </button>

          <button
            type="button"
            className="statusbar-item-interactive flex shrink-0 items-center gap-1.5 px-2"
          >
            <AlertCircle className="h-3 w-3" />
            <span>0</span>
            <AlertCircle className="h-3 w-3" style={{ color: "#cca700" }} />
            <span>0</span>
          </button>
        </div>

        <div className="flex shrink-0 items-center">
          <AnimatePresence>
            {activeWs && (
              <motion.span
                key="workspace-status"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={springs.snappy}
                className="statusbar-item-interactive hidden items-center gap-1 px-2 sm:flex"
              >
                <CheckCircle2 className="h-3 w-3" style={{ color: "#4ec994" }} />
                <span>{activeWs.city_name}</span>
              </motion.span>
            )}
          </AnimatePresence>
          <span className="statusbar-item-interactive flex items-center gap-1 px-2">
            <Wifi className="h-3 w-3" />
            <span className="hidden sm:inline">Connected</span>
          </span>
          <span className="statusbar-item-interactive px-2" style={{ opacity: 0.7 }}>
            v0.1.0
          </span>
        </div>
      </motion.div>
    </div>
  );
}

export default App;
