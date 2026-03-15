import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SetupTab } from "./SetupTab";
import { RunTab, type RunScript } from "./RunTab";
import { Activity, Globe, Square, Play, ChevronDown, RotateCcw } from "lucide-react";
import { tabContent, springs, dropdownVariants } from "@/lib/animations";

type BottomTab = "setup" | "run";

const ALL_TABS: { id: BottomTab; label: string }[] = [
  { id: "setup", label: "Setup" },
  { id: "run", label: "Run" },
];

interface BottomPanelProps {
  worktreePath?: string;
}

export function BottomPanel({ worktreePath: _worktreePath }: BottomPanelProps) {
  const [activeTab, setActiveTab] = useState<BottomTab>("setup");
  const [runningScript, setRunningScript] = useState<RunScript | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ⌘R / Ctrl+R toggles the active run script
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "r") {
        e.preventDefault();
        if (runningScript) {
          setRunningScript(null);
        } else {
          // Switch to Run tab and user can pick — for now just switch tab
          setActiveTab("run");
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [runningScript]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function onOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    window.addEventListener("mousedown", onOutside);
    return () => window.removeEventListener("mousedown", onOutside);
  }, [showDropdown]);

  function openInBrowser() {
    if (runningScript?.port) {
      window.open(`http://localhost:${runningScript.port}`, "_blank");
    }
    setShowDropdown(false);
  }

  function stopScript() {
    setRunningScript(null);
    setShowDropdown(false);
  }

  function restartScript() {
    const s = runningScript;
    setRunningScript(null);
    setShowDropdown(false);
    setTimeout(() => setRunningScript(s), 80);
  }

  const isMac = navigator.platform.toUpperCase().includes("MAC");
  const shortcut = isMac ? "⌘R" : "Ctrl+R";

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
        {/* Left: collapse + tabs */}
        <div className="flex min-w-0 flex-1 items-stretch gap-4 pl-3">
          <motion.button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex h-full items-center px-2 transition-colors duration-75 theme-hover-bg"
            aria-label={collapsed ? "Expand panel" : "Collapse panel"}
            title={collapsed ? "Expand panel" : "Collapse panel"}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <ChevronDown
                className="h-[10px] w-[10px]"
                style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
              />
            </motion.div>
          </motion.button>

          {ALL_TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex h-full items-center gap-1.5 px-2 text-[12px] font-medium transition-colors duration-75 whitespace-nowrap",
                  isActive
                    ? "text-[var(--vscode-panel-title-active-foreground)]"
                    : "text-[var(--vscode-panel-title-inactive-foreground)] hover:text-[var(--vscode-panel-title-active-foreground)]",
                )}
              >
                {tab.id === "run" && runningScript && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={springs.bouncy}
                  >
                    <Activity className="h-3.5 w-3.5 shrink-0" style={{ color: "#4ec994" }} />
                  </motion.span>
                )}
                {tab.label}
                {isActive && <span className="panel-tab-underline" />}
              </button>
            );
          })}
        </div>

        {/* Right: action buttons (only shown when Run tab active) */}
        <AnimatePresence>
          {activeTab === "run" && (
            <motion.div
              key="run-actions"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={springs.snappy}
              className="flex shrink-0 items-center gap-1.5 pr-3"
            >
              {/* Open in browser button — only when running and port is set */}
              <AnimatePresence>
                {runningScript?.port && (
                  <motion.button
                    key="open-btn"
                    initial={{ opacity: 0, scale: 0.85, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: "auto" }}
                    exit={{ opacity: 0, scale: 0.85, width: 0 }}
                    transition={springs.snappy}
                    type="button"
                    onClick={openInBrowser}
                    className="flex items-center gap-1.5 overflow-hidden rounded px-2.5 py-1 text-[11px] font-medium transition-colors duration-75 theme-hover-bg whitespace-nowrap"
                    style={{
                      color: "var(--vscode-sidebar-foreground)",
                      border: "1px solid var(--vscode-panel-border)",
                    }}
                    title={`Open http://localhost:${runningScript.port}`}
                  >
                    <Globe className="h-3 w-3 shrink-0" />
                    <span>Open :{runningScript.port}</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Run / Stop split button */}
              <div className="relative flex items-stretch" ref={dropdownRef}>
                {/* Main action button */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    if (runningScript) {
                      stopScript();
                    } else {
                      setActiveTab("run");
                    }
                  }}
                  className="flex items-center gap-1.5 rounded-l px-2.5 py-1 text-[11px] font-medium transition-colors duration-75 theme-hover-bg whitespace-nowrap"
                  style={{
                    color: "var(--vscode-sidebar-foreground)",
                    border: "1px solid var(--vscode-panel-border)",
                    borderRight: "none",
                  }}
                  title={runningScript ? `Stop (${shortcut})` : `Run (${shortcut})`}
                >
                  {runningScript ? (
                    <>
                      <Square className="h-3 w-3 shrink-0" style={{ color: "#f48771" }} />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <Play className="h-3 w-3 shrink-0" style={{ color: "#4ec994" }} />
                      <span>Run</span>
                    </>
                  )}
                  <span
                    className="ml-0.5 text-[10px] font-normal opacity-50"
                  >
                    {shortcut}
                  </span>
                </motion.button>

                {/* Dropdown caret */}
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDropdown((v) => !v)}
                  className="flex items-center rounded-r px-1.5 transition-colors duration-75 theme-hover-bg"
                  style={{
                    color: "var(--vscode-sidebar-foreground)",
                    border: "1px solid var(--vscode-panel-border)",
                  }}
                  aria-label="More run options"
                  aria-haspopup="menu"
                  aria-expanded={showDropdown}
                >
                  <ChevronDown className="h-3 w-3 opacity-70" />
                </motion.button>

                {/* Dropdown menu */}
                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      key="dropdown"
                      variants={dropdownVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-md py-1"
                      style={{
                        backgroundColor: "var(--vscode-menu-background, #1e1e1e)",
                        border: "1px solid var(--vscode-menu-border, rgba(255,255,255,0.12))",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                      }}
                      role="menu"
                    >
                      {runningScript ? (
                        <>
                          <DropdownItem
                            icon={<Square className="h-3.5 w-3.5" style={{ color: "#f48771" }} />}
                            label="Stop"
                            shortcut={shortcut}
                            onClick={stopScript}
                          />
                          <DropdownItem
                            icon={<RotateCcw className="h-3.5 w-3.5" />}
                            label="Restart"
                            onClick={restartScript}
                          />
                          {runningScript.port && (
                            <>
                              <div
                                className="my-1 h-px"
                                style={{ backgroundColor: "var(--vscode-menu-border, rgba(255,255,255,0.08))" }}
                              />
                              <DropdownItem
                                icon={<Globe className="h-3.5 w-3.5" />}
                                label={`Open in Browser (:${runningScript.port})`}
                                onClick={openInBrowser}
                              />
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          <DropdownItem
                            icon={<Play className="h-3.5 w-3.5" style={{ color: "#4ec994" }} />}
                            label="Run"
                            shortcut={shortcut}
                            onClick={() => { setActiveTab("run"); setShowDropdown(false); }}
                          />
                          <div
                            className="my-1 h-px"
                            style={{ backgroundColor: "var(--vscode-menu-border, rgba(255,255,255,0.08))" }}
                          />
                          <DropdownItem
                            icon={<Activity className="h-3.5 w-3.5" />}
                            label="Run in Background"
                            onClick={() => { setActiveTab("run"); setShowDropdown(false); }}
                          />
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Panel content */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="panel-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="min-h-0 flex-1 overflow-hidden"
            style={{ minHeight: 0 }}
          >
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
                {activeTab === "run" && (
                  <RunTab
                    runningScriptId={runningScript?.id ?? null}
                    onRunningChange={setRunningScript}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Dropdown item ─────────────────────────────────────────────────────────────

interface DropdownItemProps {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick: () => void;
}

function DropdownItem({ icon, label, shortcut, onClick }: DropdownItemProps) {
  return (
    <motion.button
      type="button"
      role="menuitem"
      onClick={onClick}
      whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[12px] transition-colors duration-75"
      style={{ color: "var(--vscode-menu-foreground, var(--vscode-sidebar-foreground))" }}
    >
      <span className="flex h-4 w-4 shrink-0 items-center justify-center opacity-70">
        {icon}
      </span>
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <span className="text-[10px] opacity-40">{shortcut}</span>
      )}
    </motion.button>
  );
}
