import { useState } from "react";
import { cn } from "@/lib/utils";
import { SetupTab } from "./SetupTab";
import { RunTab } from "./RunTab";
import { TerminalTab } from "./TerminalTab";
import { Plus, Activity } from "lucide-react";

type BottomTab = "setup" | "run" | "terminal";

const ALL_TABS: { id: BottomTab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "run", label: "Run" },
  { id: "terminal", label: "Terminal" },
];

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<BottomTab>("run");
  const [isRunning] = useState(true);

  return (
    <div className="vscode-panel flex h-full flex-col">
      {/* Tab bar */}
      <div
        className="flex shrink-0 items-stretch"
        style={{
          height: "44px",
          backgroundColor: "var(--vscode-panel-background)",
          borderBottom: "1px solid var(--vscode-panel-border)",
        }}
      >
        {/* Left: tabs + add button */}
        <div className="flex min-w-0 flex-1 items-stretch gap-3 pl-3">
          {/* Collapse chevron */}
          <button
            type="button"
            className="flex h-full items-center px-2 transition-colors duration-75 hover:bg-white/5"
            aria-label="Collapse panel"
          >
            <svg
              width="10"
              height="6"
              viewBox="0 0 10 6"
              fill="none"
              style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
            >
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {ALL_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex h-full items-center gap-1.5 px-3 py-1 text-[12px] font-medium transition-colors duration-75 whitespace-nowrap",
                  isActive
                    ? "text-[var(--vscode-panel-title-active-foreground)]"
                    : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
                )}
              >
                {tab.id === "run" && isActive && isRunning && (
                  <Activity
                    className="h-3.5 w-3.5 shrink-0"
                    style={{ color: "#4ec994" }}
                  />
                )}
                {tab.label}
                {isActive && <span className="panel-tab-underline" />}
              </button>
            );
          })}

          <button
            type="button"
            className="flex h-full items-center px-2.5 transition-colors duration-75 hover:bg-white/5"
            aria-label="Add tab"
          >
            <Plus
              className="h-3.5 w-3.5"
              style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
            />
          </button>
        </div>

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
