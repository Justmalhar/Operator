import { useState } from "react";
import { cn } from "@/lib/utils";
import { FileTree } from "./FileTree";
import { ChangesTab } from "./ChangesTab";
import { ChecksTab } from "./ChecksTab";

type RightTab = "files" | "changes" | "checks";

const TABS: { id: RightTab; label: string }[] = [
  { id: "files", label: "All Files" },
  { id: "changes", label: "Changes" },
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
        className="flex shrink-0 items-stretch gap-0"
        style={{
          height: "35px",
          backgroundColor: "var(--vscode-sidebar-background)",
          borderBottom: "1px solid var(--vscode-panel-border)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex h-full items-center px-3 text-[11px] font-medium uppercase tracking-wider transition-colors duration-75",
                isActive
                  ? "text-[var(--vscode-panel-title-active-foreground)]"
                  : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
              )}
            >
              {tab.label}
              {isActive && <span className="panel-tab-underline" />}
            </button>
          );
        })}
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
