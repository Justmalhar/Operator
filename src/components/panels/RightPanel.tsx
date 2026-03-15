import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileTree } from "./FileTree";
import { ChangesTab } from "./ChangesTab";
import { ChecksTab } from "./ChecksTab";
import { LayoutList, Search } from "lucide-react";

type RightTab = "files" | "changes" | "checks";

const TABS: { id: RightTab; label: string; badge?: number }[] = [
  { id: "files", label: "All files" },
  { id: "changes", label: "Changes", badge: 0 },
  { id: "checks", label: "Checks" },
];

interface RightPanelProps {
  onOpenFile?: (filename: string, filePath: string) => void;
}

export function RightPanel({ onOpenFile }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightTab>("files");

  return (
    <aside
      className="vscode-sidebar flex h-full flex-col"
      style={{ borderLeft: "1px solid var(--vscode-sidebar-section-header-border)" }}
    >
      {/* Tab bar */}
      <div
        className="flex shrink-0 items-stretch"
        style={{
          height: "44px",
          backgroundColor: "var(--vscode-sidebar-background)",
          borderBottom: "1px solid var(--vscode-panel-border)",
        }}
      >
        {/* Tabs */}
        <div className="flex min-w-0 flex-1 items-stretch gap-5 overflow-hidden pl-4">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex h-full items-center gap-1 px-3 py-1 text-[12px] font-medium transition-colors duration-75 whitespace-nowrap",
                  isActive
                    ? "text-[var(--vscode-panel-title-active-foreground)]"
                    : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
                )}
              >
                {tab.label}
                {tab.badge !== undefined && (
                  <span
                    className="text-[11px]"
                    style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
                  >
                    {tab.badge}
                  </span>
                )}
                {isActive && <span className="panel-tab-underline" />}
              </button>
            );
          })}
        </div>

        {/* Right-side icon actions */}
        <div className="flex shrink-0 items-center gap-0.5 pr-2">
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-75 hover:bg-white/8"
            aria-label="Toggle tree view"
          >
            <LayoutList
              className="h-[15px] w-[15px]"
              style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
            />
          </button>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-75 hover:bg-white/8"
            aria-label="Search files"
          >
            <Search
              className="h-[14px] w-[14px]"
              style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
            />
          </button>
        </div>
      </div>

      {/* Panel content */}
      <div className="min-h-0 flex-1">
        {activeTab === "files" && <FileTree onOpenFile={onOpenFile} />}
        {activeTab === "changes" && <ChangesTab />}
        {activeTab === "checks" && <ChecksTab />}
      </div>
    </aside>
  );
}
