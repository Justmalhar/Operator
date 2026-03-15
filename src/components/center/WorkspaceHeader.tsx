import { useRef, useState } from "react";
import { ChevronDown, Code2, GitBranch, PanelRight, Pencil } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { useSettingsStore, IDE_OPTIONS } from "@/store/settingsStore";
import { fadeInDown, springs } from "@/lib/animations";

interface WorkspaceHeaderProps {
  workspaceId: string | null;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
}

export function WorkspaceHeader({ workspaceId, showRightPanel, onToggleRightPanel }: WorkspaceHeaderProps) {
  const { repos, workspacesByRepo, renameWorkspace } = useWorkspaceStore();
  const { defaultIde, setDefaultIde } = useSettingsStore();
  const [ideDropdownOpen, setIdeDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!workspaceId) return null;

  let workspace = undefined;
  let repo = undefined;
  for (const r of repos) {
    const ws = workspacesByRepo[r.id]?.find((w) => w.id === workspaceId);
    if (ws) {
      workspace = ws;
      repo = r;
      break;
    }
  }

  if (!workspace || !repo) return null;

  const targetBranch = repo.default_branch;

  function startEdit() {
    setEditValue(workspace!.city_name);
    setIsEditing(true);
    // focus after render
    setTimeout(() => inputRef.current?.select(), 0);
  }

  async function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== workspace!.city_name) {
      await renameWorkspace(workspaceId!, trimmed);
    }
    setIsEditing(false);
    setIsHovered(false);
  }

  function cancelEdit() {
    setIsEditing(false);
    setIsHovered(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") cancelEdit();
  }

  return (
    <motion.div
      {...fadeInDown}
      className="flex h-[35px] shrink-0 items-center gap-2 px-3"
      style={{
        backgroundColor: "var(--vscode-tab-bar-background)",
        borderBottom: "1px solid var(--vscode-panel-border, var(--vscode-tab-border, rgba(128,128,128,0.2)))",
      }}
    >
      {/* Repo + workspace + branch breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-1 text-[12px]">
        {/* Repo name */}
        <motion.button
          type="button"
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="max-w-[120px] truncate rounded-md px-2 py-1 font-medium"
          style={{ color: "var(--vscode-tab-active-foreground)" }}
        >
          {repo.name}
        </motion.button>

        <span style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.3 }}>/</span>

        {/* Workspace city_name — double-click to rename */}
        <div
          className="relative flex items-center"
          onMouseEnter={() => !isEditing && setIsHovered(true)}
          onMouseLeave={() => !isEditing && setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.input
                key="input"
                ref={inputRef}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={springs.snappy}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={commitEdit}
                autoFocus
                className="rounded-md px-2 py-1 text-[12px] font-medium outline-none"
                style={{
                  minWidth: 60,
                  maxWidth: 140,
                  width: `${Math.max(60, editValue.length * 7 + 16)}px`,
                  color: "var(--vscode-tab-active-foreground)",
                  backgroundColor: "var(--vscode-input-background, rgba(255,255,255,0.08))",
                  border: "1px solid var(--vscode-focusBorder, #007fd4)",
                  caretColor: "var(--vscode-tab-active-foreground)",
                }}
              />
            ) : (
              <motion.button
                key="label"
                type="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={springs.snappy}
                onDoubleClick={startEdit}
                title="Double-click to rename workspace"
                className={cn(
                  "flex items-center gap-1 rounded-md px-2 py-1 font-medium transition-all duration-150",
                  isHovered && "cursor-text",
                )}
                style={{
                  color: "var(--vscode-tab-active-foreground)",
                  border: isHovered
                    ? "1px solid var(--vscode-focusBorder, #007fd4)"
                    : "1px solid transparent",
                  backgroundColor: isHovered ? "rgba(255,255,255,0.05)" : "transparent",
                }}
              >
                <span className="max-w-[130px] truncate">{workspace.city_name}</span>
                {isHovered && (
                  <Pencil
                    className="h-2.5 w-2.5 shrink-0 opacity-60"
                    style={{ color: "var(--vscode-focusBorder, #007fd4)" }}
                  />
                )}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <span style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.3 }}>/</span>

        {/* Branch */}
        <motion.button
          type="button"
          whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="flex items-center gap-1 rounded-md px-2 py-1"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          <GitBranch className="h-3.5 w-3.5 shrink-0" />
          <span className="max-w-[120px] truncate text-[12px]">{workspace.branch_name}</span>
          <ChevronDown className="h-2.5 w-2.5 shrink-0 opacity-50" />
        </motion.button>

        <span
          className="text-[10px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.3 }}
        >
          &rarr;
        </span>

        <span
          className="truncate text-[11px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.45 }}
        >
          {targetBranch}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex shrink-0 items-center gap-1">
        {/* Open in IDE split button */}
        <div className="relative">
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={springs.snappy}
            className="flex items-stretch overflow-hidden rounded-md"
            style={{ border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.08))" }}
          >
            <button
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium transition-colors duration-75 theme-hover-bg"
              style={{ color: "var(--vscode-tab-inactive-foreground)" }}
              title={`Open in ${IDE_OPTIONS.find((i) => i.id === defaultIde)?.label ?? "IDE"}`}
            >
              <Code2 className="h-3.5 w-3.5 shrink-0" />
              Open in {IDE_OPTIONS.find((i) => i.id === defaultIde)?.label ?? "IDE"}
            </button>
            <div style={{ width: "1px", backgroundColor: "var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.08))" }} />
            <button
              type="button"
              onClick={() => setIdeDropdownOpen((v) => !v)}
              className="flex items-center px-1.5 py-1.5 transition-colors duration-75 theme-hover-bg"
              style={{ color: "var(--vscode-tab-inactive-foreground)" }}
              title="Switch IDE"
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </motion.div>

          <AnimatePresence>
            {ideDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.97 }}
                transition={springs.snappy}
                className="absolute right-0 top-full z-50 mt-1 min-w-[160px] overflow-hidden rounded-lg py-1"
                style={{
                  backgroundColor: "var(--vscode-dropdown-background)",
                  border: "1px solid var(--vscode-dropdown-border, var(--vscode-panel-border))",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                }}
                onMouseLeave={() => setIdeDropdownOpen(false)}
              >
                {IDE_OPTIONS.map((ide) => (
                  <button
                    key={ide.id}
                    type="button"
                    onClick={() => { void setDefaultIde(ide.id); setIdeDropdownOpen(false); }}
                    className="flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-[12px] transition-colors theme-hover-bg"
                    style={{
                      color: "var(--vscode-dropdown-foreground)",
                      backgroundColor: defaultIde === ide.id ? "var(--vscode-toolbar-hover-background)" : undefined,
                      fontWeight: defaultIde === ide.id ? 600 : 400,
                    }}
                  >
                    <span>{ide.label}</span>
                    <span className="font-mono text-[10px] opacity-40">{ide.command}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Toggle right panel — at far end */}
        {onToggleRightPanel && (
          <motion.button
            type="button"
            onClick={onToggleRightPanel}
            whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-md"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: showRightPanel ? 1 : 0.4 }}
            title="Toggle right panel"
          >
            <PanelRight className="h-3.5 w-3.5" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
