import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileTree } from "./FileTree";
import { ChangesTab } from "./ChangesTab";
import { ChecksTab } from "./ChecksTab";
import { Search, ChevronDown } from "lucide-react";
import { TodosPanel } from "@/components/todos/TodosPanel";

interface RightPanelProps {
  worktreePath?: string;
  onOpenFile?: (filename: string, filePath: string) => void;
  activeSection?: string | null;
  onSectionOpen?: (section: string) => void;
}

interface SectionHeaderProps {
  label: string;
  isCollapsed: boolean;
  onToggle: () => void;
  actions?: React.ReactNode;
}

function SectionHeader({ label, isCollapsed, onToggle, actions }: SectionHeaderProps) {
  return (
    <div
      className="vscode-sidebar-section-header flex shrink-0 items-center justify-between"
      style={{
        height: "35px",
        backgroundColor: "var(--vscode-sideBarSectionHeader-background, var(--vscode-sideBar-background))",
        borderTop: "1px solid var(--vscode-sideBar-border, var(--vscode-panel-border, rgba(128,128,128,0.2)))",
        borderBottom: "1px solid var(--vscode-sideBar-border, var(--vscode-panel-border, rgba(128,128,128,0.2)))",
        cursor: "pointer",
      }}
      onClick={onToggle}
    >
      <div className="flex h-full items-center gap-1 overflow-hidden">
        <div
          className="flex h-full w-8 items-center justify-center transition-colors duration-75 theme-hover-bg"
          aria-label={isCollapsed ? "Expand section" : "Collapse section"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? -90 : 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="flex items-center justify-center"
          >
            <ChevronDown
              className="h-3 w-3"
              style={{ color: "var(--vscode-sidebar-foreground)" }}
            />
          </motion.div>
        </div>
        <span
          className="truncate text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
        >
          {label}
        </span>
      </div>
      {actions && !isCollapsed && (
        <div className="flex items-center pr-2" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}

export function RightPanel({ worktreePath, onOpenFile, activeSection, onSectionOpen }: RightPanelProps) {
  const [explorerCollapsed, setExplorerCollapsed] = useState(false);

  const changesOpen = activeSection === "changes";
  const checksOpen = activeSection === "checks";
  const todosOpen = activeSection === "todos";

  return (
    <aside
      className="vscode-sidebar flex flex-1 flex-col"
      style={{
        borderLeft: "1px solid var(--vscode-sideBar-border, var(--vscode-panel-border, rgba(128,128,128,0.25)))",
      }}
    >
      {/* Explorer Section — independent toggle */}
      <div className="flex flex-col shrink-0">
        <SectionHeader
          label="Explorer"
          isCollapsed={explorerCollapsed}
          onToggle={() => setExplorerCollapsed(!explorerCollapsed)}
          actions={
            <motion.button
              type="button"
              whileHover={{ backgroundColor: "var(--vscode-toolbar-hover-background)" }}
              className="flex h-5 w-5 items-center justify-center rounded"
            >
              <Search className="h-3.5 w-3.5 opacity-70" />
            </motion.button>
          }
        />
        <AnimatePresence initial={false}>
          {!explorerCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 280, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <FileTree worktreePath={worktreePath} onOpenFile={onOpenFile} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Spacer — pushes accordion sections to the bottom */}
      <div className="flex-1" />

      {/* Version Control Section */}
      <div className="flex flex-col shrink-0">
        <SectionHeader
          label="Version Control"
          isCollapsed={!changesOpen}
          onToggle={() => onSectionOpen?.("changes")}
        />
        <AnimatePresence initial={false}>
          {changesOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 420, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ChangesTab worktreePath={worktreePath} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Checks Section */}
      <div className="flex flex-col shrink-0">
        <SectionHeader
          label="Checks"
          isCollapsed={!checksOpen}
          onToggle={() => onSectionOpen?.("checks")}
        />
        <AnimatePresence initial={false}>
          {checksOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 200, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <ChecksTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Todos Section */}
      <div className="flex flex-col shrink-0">
        <SectionHeader
          label="Todos"
          isCollapsed={!todosOpen}
          onToggle={() => onSectionOpen?.("todos")}
        />
        <AnimatePresence initial={false}>
          {todosOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 240, opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <TodosPanel hideHeader />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
