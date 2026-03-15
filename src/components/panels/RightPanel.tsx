import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FileTree } from "./FileTree";
import { ChangesTab } from "./ChangesTab";
import { ChecksTab } from "./ChecksTab";
import { CheckSquare, Search } from "lucide-react";
import { tabContent, springs } from "@/lib/animations";
import { TodosPanel } from "@/components/todos/TodosPanel";

type RightTab = "files" | "changes" | "checks" | "todos";

const TABS: { id: RightTab; label: string }[] = [
  { id: "files", label: "All files" },
  { id: "changes", label: "Changes" },
  { id: "checks", label: "Checks" },
  { id: "todos", label: "Todos" },
];

interface RightPanelProps {
  worktreePath?: string;
  onOpenFile?: (filename: string, filePath: string) => void;
}

export function RightPanel({ worktreePath, onOpenFile }: RightPanelProps) {
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
        <div className="flex min-w-0 flex-1 items-stretch gap-2 overflow-hidden pl-3 sm:gap-5 sm:pl-4">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex h-full items-center gap-1 px-1.5 py-1 text-[11px] font-medium transition-colors duration-75 whitespace-nowrap sm:px-3 sm:text-[12px]",
                  isActive
                    ? "text-[var(--vscode-panel-title-active-foreground)]"
                    : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
                )}
              >
                {tab.id === "todos" && (
                  <CheckSquare className="h-[12px] w-[12px] shrink-0" />
                )}
                {tab.label}
                {isActive && <span className="panel-tab-underline" />}
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 pr-2">
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
            onClick={() => setActiveTab("todos")}
            className="flex h-7 w-7 items-center justify-center rounded"
            aria-label="Todos"
          >
            <CheckSquare
              className="h-[15px] w-[15px]"
              style={{ color: activeTab === "todos" ? "var(--vscode-panel-title-active-foreground)" : "var(--vscode-panel-title-inactive-foreground)" }}
            />
          </motion.button>
          <motion.button
            type="button"
            whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
            className="flex h-7 w-7 items-center justify-center rounded"
            aria-label="Search files"
          >
            <Search
              className="h-[14px] w-[14px]"
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
            {activeTab === "files" && <FileTree worktreePath={worktreePath} onOpenFile={onOpenFile} />}
            {activeTab === "changes" && <ChangesTab worktreePath={worktreePath} />}
            {activeTab === "checks" && <ChecksTab />}
            {activeTab === "todos" && <TodosPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </aside>
  );
}
