import { useState } from "react";
import { cn } from "@/lib/utils";
import { SetupTab } from "./SetupTab";
import { RunTab } from "./RunTab";
import { TerminalTab } from "./TerminalTab";

type BottomTab = "setup" | "run" | "terminal";

const TABS: { id: BottomTab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "run", label: "Run" },
  { id: "terminal", label: "Terminal" },
];

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<BottomTab>("terminal");

  return (
    <div
      className="flex h-full flex-col"
      style={{
        backgroundColor: "var(--vscode-editor-background)",
        borderTop: "1px solid var(--vscode-sidebar-section-header-border)",
      }}
    >
      {/* Tab bar */}
      <div className="vscode-tab-bar flex shrink-0 items-stretch" style={{ height: "35px" }}>
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
        {activeTab === "setup" && <SetupTab />}
        {activeTab === "run" && <RunTab />}
        {activeTab === "terminal" && <TerminalTab />}
      </div>
    </div>
  );
}
