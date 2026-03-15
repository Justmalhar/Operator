import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SetupTab } from "./SetupTab";
import { RunTab, type RunScript } from "./RunTab";
import { Globe, Square, Play, ChevronDown, RotateCcw } from "lucide-react";

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
        borderTop: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.2))",
        borderBottom: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.2))",
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

interface BottomPanelProps {
  worktreePath?: string;
  activeSection?: string | null;
  onSectionOpen?: (section: string) => void;
}

export function BottomPanel({ worktreePath: _worktreePath, activeSection, onSectionOpen }: BottomPanelProps) {
  const [runningScript, setRunningScript] = useState<RunScript | null>(null);

  const setupOpen = activeSection === "setup";
  const runOpen = activeSection === "run";

  const [setupRunTrigger, setSetupRunTrigger] = useState(0);
  const [setupRerunTrigger, setSetupRerunTrigger] = useState(0);
  const [setupRunning, setSetupRunning] = useState(false);

  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().includes("MAC");
  const runShortcut = isMac ? "⌘R" : "Ctrl+R";
  const stopShortcut = isMac ? "⌘." : "Ctrl+.";

  // Keyboard shortcuts for Run section
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = isMac ? e.metaKey : e.ctrlKey;
      if (mod && e.key === "r") {
        e.preventDefault();
        if (runningScript) {
          setRunningScript(null);
        } else {
          onSectionOpen?.("run");
        }
      }
      if (mod && e.key === ".") {
        e.preventDefault();
        if (runningScript) setRunningScript(null);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runningScript, isMac]);

  function openInBrowser() {
    if (runningScript?.port) window.open(`http://localhost:${runningScript.port}`, "_blank");
  }

  return (
    <div className="flex flex-col">
      {/* Setup Section */}
      <div className="flex flex-col shrink-0">
        <SectionHeader
          label="Setup"
          isCollapsed={!setupOpen}
          onToggle={() => onSectionOpen?.("setup")}
          actions={
            <div className="flex items-center gap-1">
              {/* Reinstall button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  onSectionOpen?.("setup");
                  setSetupRerunTrigger((n) => n + 1);
                }}
                disabled={setupRunning}
                className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-75 theme-hover-bg"
                style={{
                  border: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))",
                  opacity: setupRunning ? 0.4 : 1,
                  cursor: setupRunning ? "not-allowed" : "pointer",
                }}
                title="Reinstall (clear & rerun setup)"
              >
                <RotateCcw className="h-[10px] w-[10px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }} />
              </motion.button>

              {/* Run Setup button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  onSectionOpen?.("setup");
                  setSetupRunTrigger((n) => n + 1);
                }}
                disabled={setupRunning}
                className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[10px] font-medium transition-colors duration-75 theme-hover-bg"
                style={{
                  color: setupRunning
                    ? "var(--vscode-tab-inactive-foreground)"
                    : "var(--vscode-terminal-ansi-green, #4ec994)",
                  border: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))",
                  cursor: setupRunning ? "not-allowed" : "pointer",
                }}
                title="Run setup script"
              >
                {setupRunning ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="flex items-center"
                  >
                    <RotateCcw className="h-[9px] w-[9px]" />
                  </motion.div>
                ) : (
                  <Play className="h-[9px] w-[9px]" fill="currentColor" />
                )}
                <span>{setupRunning ? "Running…" : "Setup"}</span>
              </motion.button>
            </div>
          }
        />
        <AnimatePresence initial={false}>
          {setupOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <SetupTab
                runTrigger={setupRunTrigger}
                rerunTrigger={setupRerunTrigger}
                onRunningChange={setSetupRunning}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Run Section */}
      <div className="flex flex-col shrink-0">
        <SectionHeader
          label="Run"
          isCollapsed={!runOpen}
          onToggle={() => onSectionOpen?.("run")}
          actions={
            <div className="flex items-center gap-1.5">
              {/* Running pulse */}
              <AnimatePresence>
                {runningScript && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                  >
                    <motion.span
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
                      className="inline-flex h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: "var(--vscode-terminal-ansi-green, #4ec994)", boxShadow: "0 0 5px var(--vscode-terminal-ansi-green, #4ec994)" }}
                    />
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Open localhost:PORT */}
              <AnimatePresence>
                {runningScript?.port && (
                  <motion.button
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    type="button"
                    onClick={openInBrowser}
                    className="flex items-center gap-1 overflow-hidden rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors duration-75 theme-hover-bg whitespace-nowrap"
                    style={{
                      color: "var(--vscode-textLink-foreground, #4ec994)",
                      border: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))",
                    }}
                    title={`Open http://localhost:${runningScript.port}`}
                  >
                    <Globe className="h-2.5 w-2.5 shrink-0" />
                    <span>localhost:{runningScript.port}</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Run / Stop icon button */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.88 }}
                onClick={() => {
                  if (runningScript) {
                    setRunningScript(null);
                  } else {
                    onSectionOpen?.("run");
                  }
                }}
                className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-75 theme-hover-bg"
                style={{ border: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.3))" }}
                title={runningScript ? `Stop (${stopShortcut})` : `Run (${runShortcut})`}
              >
                {runningScript ? (
                  <Square className="h-[9px] w-[9px]" fill="currentColor" style={{ color: "var(--vscode-errorForeground, #f48771)" }} />
                ) : (
                  <Play className="h-[10px] w-[10px]" fill="currentColor" style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }} />
                )}
              </motion.button>
            </div>
          }
        />
        <AnimatePresence initial={false}>
          {runOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <RunTab
                runningScriptId={runningScript?.id ?? null}
                onRunningChange={(script) => {
                  setRunningScript(script);
                  if (script) onSectionOpen?.("run");
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
