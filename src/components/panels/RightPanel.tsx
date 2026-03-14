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

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<RightTab>("files");

  return (
    <aside
      className="vscode-sidebar flex h-full flex-col"
      style={{ borderLeft: "1px solid var(--vscode-sidebar-section-header-border)" }}
    >
      {/* Tab bar */}
      <div
        className="vscode-tab-bar flex shrink-0 items-stretch"
        style={{ height: "35px" }}
      >
        {TABS.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "vscode-tab flex h-full items-center px-3 text-[12px] font-medium transition-colors duration-75",
                isActive && "active",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panel content */}
      <div className="min-h-0 flex-1">
        {activeTab === "files" && <FileTree />}
        {activeTab === "changes" && <ChangesTab />}
        {activeTab === "checks" && <ChecksTab />}
      </div>
    </aside>
  );
}
