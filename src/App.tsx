import { useRef, useState } from "react";
import "./App.css";
import { cn } from "@/lib/utils";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { CenterPanel, type CenterPanelHandle } from "@/components/center/CenterPanel";
import { RightPanel } from "@/components/panels/RightPanel";
import { BottomPanel } from "@/components/panels/BottomPanel";
import { PreferencesPage } from "@/pages/PreferencesPage";
import { HelpPage } from "@/pages/HelpPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { type SidebarNavItemId } from "@/components/sidebar/SidebarNav";
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Cloud,
  GitBranch,
  PanelRight,
  Radio,
  Wifi,
} from "lucide-react";

const FULL_PAGE_ITEMS: SidebarNavItemId[] = ["preferences", "help", "settings"];

function App() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>("ws-los-angeles");
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [activeItem, setActiveItem] = useState<SidebarNavItemId>("activity");
  const centerRef = useRef<CenterPanelHandle>(null);

  const isFullPage = FULL_PAGE_ITEMS.includes(activeItem);

  return (
    <div className="vscode-editor flex h-screen flex-col overflow-hidden">
      {/* ── Title bar ────────────────────────────────────────────────────── */}
      <div className="vscode-titlebar flex shrink-0 items-center" data-tauri-drag-region>
        <div className="w-[78px] shrink-0" />
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <span
            className="text-[12px] font-medium tracking-wide"
            style={{ color: "var(--vscode-titlebar-foreground)", opacity: 0.7 }}
          >
            Operator
          </span>
        </div>
        <div className="flex items-center gap-0.5 pr-2">
          <button
            type="button"
            className="titlebar-action-btn flex h-[28px] w-[28px] items-center justify-center rounded-md transition-colors duration-75"
            style={{ color: "var(--vscode-titlebar-foreground)", opacity: 0.6 }}
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-3.5 w-3.5" />
          </button>
          {/* Only show right panel toggle when not in full-page mode */}
          {!isFullPage && (
            <button
              type="button"
              onClick={() => setShowRightPanel((v) => !v)}
              className={cn(
                "titlebar-action-btn flex h-[28px] w-[28px] items-center justify-center rounded-md transition-colors duration-75",
                showRightPanel ? "opacity-100" : "opacity-40",
              )}
              style={{ color: "var(--vscode-titlebar-foreground)" }}
              aria-label="Toggle right panel"
              title="Toggle right panel"
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        <SidebarLayout
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={setActiveWorkspaceId}
          activeItem={activeItem}
          onItemChange={setActiveItem}
        />

        {isFullPage ? (
          /* Full-page mode: Preferences, Help, or Settings */
          <div className="flex min-w-0 flex-1">
            {activeItem === "preferences" && <PreferencesPage />}
            {activeItem === "help" && <HelpPage />}
            {activeItem === "settings" && <SettingsPage />}
          </div>
        ) : (
          /* Normal workspace mode */
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <CenterPanel ref={centerRef} workspaceId={activeWorkspaceId} />
            </div>

            {showRightPanel && (
              <div className="flex w-[420px] shrink-0 flex-col">
                <div className="min-h-0 flex-1">
                  <RightPanel
                    onOpenFile={(filename, filePath) =>
                      centerRef.current?.openFile(filename, filePath)
                    }
                  />
                </div>
                <div className="h-[260px] shrink-0">
                  <BottomPanel />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Status bar — rich IDE-grade ───────────────────────────────────── */}
      <div className="vscode-statusbar flex h-[22px] shrink-0 items-center justify-between text-[11px]">
        <div className="flex items-center">
          <button
            type="button"
            className="statusbar-item-interactive flex items-center gap-1.5 px-2"
            style={{ backgroundColor: "var(--vscode-statusbar-remote-background, #16825d)", color: "#fff" }}
          >
            <Radio className="h-3 w-3" />
            <span className="font-medium">Operator</span>
          </button>

          <button
            type="button"
            className="statusbar-item-interactive flex items-center gap-1 px-2"
          >
            <GitBranch className="h-3 w-3" />
            <span>main</span>
          </button>

          <button
            type="button"
            className="statusbar-item-interactive flex items-center gap-1 px-2"
          >
            <Cloud className="h-3 w-3" />
          </button>

          <button
            type="button"
            className="statusbar-item-interactive flex items-center gap-1.5 px-2"
          >
            <AlertCircle className="h-3 w-3" />
            <span>0</span>
            <AlertCircle className="h-3 w-3" style={{ color: "#cca700" }} />
            <span>0</span>
          </button>
        </div>

        <div className="flex items-center">
          {activeWorkspaceId && !isFullPage && (
            <span className="statusbar-item-interactive flex items-center gap-1 px-2">
              <CheckCircle2 className="h-3 w-3" style={{ color: "#4ec994" }} />
              <span>Los Angeles</span>
            </span>
          )}
          <span className="statusbar-item-interactive flex items-center gap-1 px-2">
            <Wifi className="h-3 w-3" />
            <span>Connected</span>
          </span>
          <span className="statusbar-item-interactive px-2" style={{ opacity: 0.7 }}>
            v0.1.0
          </span>
        </div>
      </div>
    </div>
  );
}

export default App;
