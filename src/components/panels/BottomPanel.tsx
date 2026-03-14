import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SetupTab } from "./SetupTab";
import { RunTab } from "./RunTab";
import { TerminalTab } from "./TerminalTab";

type BottomTab = "setup" | "run" | "terminal";

const ALL_TABS: { id: BottomTab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "run", label: "Run" },
  { id: "terminal", label: "Terminal" },
];

export function BottomPanel() {
  const [activeTab, setActiveTab] = useState<BottomTab>("terminal");
  const [openTabs, setOpenTabs] = useState<BottomTab[]>(["setup", "run", "terminal"]);

  function closeTab(e: React.MouseEvent, id: BottomTab) {
    e.stopPropagation();
    const next = openTabs.filter((t) => t !== id);
    setOpenTabs(next);
    if (activeTab === id) {
      setActiveTab(next[next.length - 1] ?? "terminal");
    }
  }

  return (
    <div className="vscode-panel flex h-full flex-col">
      {/* Tab bar */}
      <div
        className="flex shrink-0 items-stretch"
        style={{
          height: "35px",
          backgroundColor: "var(--vscode-panel-background)",
          borderBottom: "1px solid var(--vscode-panel-border)",
        }}
      >
        {ALL_TABS.filter((t) => openTabs.includes(t.id)).map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "group relative flex h-full items-center gap-1.5 pl-3 pr-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors duration-75",
                isActive
                  ? "text-[var(--vscode-panel-title-active-foreground)]"
                  : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
              )}
            >
              {tab.label}
              {isActive && <span className="panel-tab-underline" />}
              <span
                onClick={(e) => closeTab(e, tab.id)}
                className={cn(
                  "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded transition-all duration-75 hover:bg-white/10",
                  !isActive && "opacity-0 group-hover:opacity-100",
                )}
                role="button"
                tabIndex={0}
                aria-label={`Close ${tab.label}`}
              >
                <X className="h-3 w-3" />
              </span>
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
