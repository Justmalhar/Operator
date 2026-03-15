import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SetupTab } from "./SetupTab";
import { RunTab } from "./RunTab";
import { TerminalTab } from "./TerminalTab";
import { Plus, Activity } from "lucide-react";
import { tabContent, springs } from "@/lib/animations";

type BottomTab = "setup" | "run" | "terminal";

const ALL_TABS: { id: BottomTab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "run", label: "Run" },
  { id: "terminal", label: "Terminal" },
];

interface BottomPanelProps {
  worktreePath?: string;
}

export function BottomPanel({ worktreePath }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("terminal");
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
        <div className="flex min-w-0 flex-1 items-stretch gap-1 pl-2 sm:gap-3 sm:pl-3">
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
                  "relative flex h-full items-center gap-1 px-1.5 py-1 text-[11px] font-medium transition-colors duration-75 whitespace-nowrap sm:gap-1.5 sm:px-3 sm:text-[12px]",
                  isActive
                    ? "text-[var(--vscode-panel-title-active-foreground)]"
                    : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
                )}
              >
                {tab.id === "run" && isActive && isRunning && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springs.bouncy}
                  >
                    <Activity
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: "#4ec994" }}
                    />
                  </motion.span>
                )}
                {tab.label}
                {isActive && <span className="panel-tab-underline" />}
              </button>
            );
          })}

          <motion.button
            type="button"
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-full items-center px-2.5"
            aria-label="Add tab"
          >
            <Plus
              className="h-3.5 w-3.5"
              style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
            />
          </motion.button>
        </div>

      </div>

      {/* Panel content with animated transitions */}
      <div className="min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="h-full"
          >
            {activeTab === "setup" && <SetupTab />}
            {activeTab === "run" && <RunTab />}
            {activeTab === "terminal" && <TerminalTab worktreePath={worktreePath} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
