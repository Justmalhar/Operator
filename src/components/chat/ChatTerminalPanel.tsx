import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Terminal } from "lucide-react";
import { TerminalTab } from "@/components/panels/TerminalTab";
import { cn } from "@/lib/utils";
import { springs } from "@/lib/animations";

// Visibility is controlled by the parent (ChatPanel) via AnimatePresence.

interface TerminalInstance {
  id: string;
  label: string;
}

interface ChatTerminalPanelProps {
  worktreePath?: string;
}

const DEFAULT_HEIGHT = 220;
const MIN_HEIGHT = 120;
const MAX_HEIGHT = 500;

export function ChatTerminalPanel({ worktreePath }: ChatTerminalPanelProps) {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([
    { id: "terminal-1", label: "Terminal 1" },
  ]);
  const [activeId, setActiveId] = useState("terminal-1");
  const [height, setHeight] = useState(DEFAULT_HEIGHT);

  const dragStartY = useRef<number | null>(null);
  const dragStartHeight = useRef<number>(DEFAULT_HEIGHT);

  function addTerminal() {
    const n = terminals.length + 1;
    const id = `terminal-${Date.now()}`;
    const newT: TerminalInstance = { id, label: `Terminal ${n}` };
    setTerminals((prev) => [...prev, newT]);
    setActiveId(id);
  }

  function closeTerminal(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setTerminals((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((t) => t.id !== id);
      if (id === activeId) setActiveId(next[next.length - 1].id);
      return next;
    });
  }

  function onDragHandleMouseDown(e: React.MouseEvent) {
    e.preventDefault();
    dragStartY.current = e.clientY;
    dragStartHeight.current = height;

    function onMouseMove(ev: MouseEvent) {
      if (dragStartY.current === null) return;
      const delta = dragStartY.current - ev.clientY;
      const next = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, dragStartHeight.current + delta));
      setHeight(next);
    }

    function onMouseUp() {
      dragStartY.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  return (
    <div
      className="flex shrink-0 flex-col"
      style={{
        borderTop: "1px solid var(--vscode-panel-border)",
        backgroundColor: "var(--vscode-panel-background)",
      }}
    >
      {/* Drag resize handle */}
      <div
        className="group flex h-[4px] cursor-ns-resize items-center justify-center hover:bg-[var(--vscode-focusBorder,#007fd4)] transition-colors duration-100"
        onMouseDown={onDragHandleMouseDown}
        title="Drag to resize"
      >
        <div
          className="h-[2px] w-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-100"
          style={{ backgroundColor: "var(--vscode-focusBorder, #007fd4)" }}
        />
      </div>

      {/* Tab bar */}
      <div
        className="flex shrink-0 items-stretch"
        style={{
          height: "36px",
          backgroundColor: "var(--vscode-panel-background)",
          borderBottom: "1px solid var(--vscode-panel-border)",
        }}
      >
        {/* Terminal icon label */}
        <div className="flex items-center gap-1.5 pl-3 pr-2" style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}>
          <Terminal className="h-3.5 w-3.5" />
        </div>

        {/* Terminal tabs */}
        <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
          <AnimatePresence mode="popLayout">
            {terminals.map((t) => {
              const isActive = t.id === activeId;
              return (
                <motion.button
                  key={t.id}
                  layout
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={springs.snappy}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  className={cn(
                    "group relative flex h-full items-center gap-1.5 whitespace-nowrap px-3 text-[11px] font-medium transition-colors duration-75",
                    isActive
                      ? "text-[var(--vscode-panel-title-active-foreground)]"
                      : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
                  )}
                >
                  <span>{t.label}</span>
                  {terminals.length > 1 && (
                    <span
                      className={cn(
                        "flex h-[16px] w-[16px] items-center justify-center rounded transition-all duration-75",
                        "theme-hover-bg",
                        !isActive && "opacity-0 group-hover:opacity-100",
                      )}
                      onClick={(e) => closeTerminal(t.id, e)}
                      role="button"
                      aria-label={`Close ${t.label}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </span>
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="chat-terminal-underline"
                      className="panel-tab-underline"
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {/* Add terminal button */}
          <motion.button
            type="button"
            onClick={addTerminal}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="flex h-full items-center px-2.5"
            aria-label="New terminal"
            title="New terminal (same worktree)"
          >
            <Plus
              className="h-3.5 w-3.5"
              style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
            />
          </motion.button>
        </div>
      </div>

      {/* Terminal content */}
      <div style={{ height }}>
        {terminals.map((t) => (
          <div
            key={t.id}
            className="h-full"
            style={{ display: t.id === activeId ? "block" : "none" }}
          >
            <TerminalTab worktreePath={worktreePath} />
          </div>
        ))}
      </div>
    </div>
  );
}
