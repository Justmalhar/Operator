import React, { useRef, useState, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Plus,
  GitBranch,
  FolderGit2,
} from "lucide-react";
import { Composer } from "@/components/composer/Composer";
// Inline SVG components for model provider logos
function ClaudeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width="256" height="256" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <path fill="#D97757" d="m50.228 170.321l50.357-28.257l.843-2.463l-.843-1.361h-2.462l-8.426-.518l-28.775-.778l-24.952-1.037l-24.175-1.296l-6.092-1.297L0 125.796l.583-3.759l5.12-3.434l7.324.648l16.202 1.101l24.304 1.685l17.629 1.037l26.118 2.722h4.148l.583-1.685l-1.426-1.037l-1.101-1.037l-25.147-17.045l-27.22-18.017l-14.258-10.37l-7.713-5.25l-3.888-4.925l-1.685-10.758l7-7.713l9.397.649l2.398.648l9.527 7.323l20.35 15.75L94.817 91.9l3.889 3.24l1.555-1.102l.195-.777l-1.75-2.917l-14.453-26.118l-15.425-26.572l-6.87-11.018l-1.814-6.61c-.648-2.723-1.102-4.991-1.102-7.778l7.972-10.823L71.42 0l10.63 1.426l4.472 3.888l6.61 15.101l10.694 23.786l16.591 32.34l4.861 9.592l2.592 8.879l.973 2.722h1.685v-1.556l1.36-18.211l2.528-22.36l2.463-28.776l.843-8.1l4.018-9.722l7.971-5.25l6.222 2.981l5.12 7.324l-.713 4.73l-3.046 19.768l-5.962 30.98l-3.889 20.739h2.268l2.593-2.593l10.499-13.934l17.628-22.036l7.778-8.749l9.073-9.657l5.833-4.601h11.018l8.1 12.055l-3.628 12.443l-11.342 14.388l-9.398 12.184l-13.48 18.147l-8.426 14.518l.778 1.166l2.01-.194l30.46-6.481l16.462-2.982l19.637-3.37l8.88 4.148l.971 4.213l-3.5 8.62l-20.998 5.184l-24.628 4.926l-36.682 8.685l-.454.324l.519.648l16.526 1.555l7.065.389h17.304l32.21 2.398l8.426 5.574l5.055 6.805l-.843 5.184l-12.962 6.611l-17.498-4.148l-40.83-9.721l-14-3.5h-1.944v1.167l11.666 11.406l21.387 19.314l26.767 24.887l1.36 6.157l-3.434 4.86l-3.63-.518l-23.526-17.693l-9.073-7.972l-20.545-17.304h-1.36v1.814l4.73 6.935l25.017 37.59l1.296 11.536l-1.814 3.76l-6.481 2.268l-7.13-1.297l-14.647-20.544l-15.1-23.138l-12.185-20.739l-1.49.843l-7.194 77.448l-3.37 3.953l-7.778 2.981l-6.48-4.925l-3.436-7.972l3.435-15.749l4.148-20.544l3.37-16.333l3.046-20.285l1.815-6.74l-.13-.454l-1.49.194l-15.295 20.999l-23.267 31.433l-18.406 19.702l-4.407 1.75l-7.648-3.954l.713-7.064l4.277-6.286l25.47-32.405l15.36-20.092l9.917-11.6l-.065-1.686h-.583L44.07 198.125l-12.055 1.555l-5.185-4.86l.648-7.972l2.463-2.593l20.35-13.999z" />
    </svg>
  );
}

function OpenAIIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.1 13.3L8 16.8l-4.2-2.6A4 4 0 0 1 6 6.7m6 7.8L6 11V6a4 4 0 0 1 7.6-2m-3.7 9.3V6.2l4.4-2.6a4 4 0 0 1 5.3 5.8m-9.7 1.3L16 7.2l4.2 2.6a4 4 0 0 1-2.2 7.5m-6-7.8l6 3.5v5a4 4 0 0 1-7.6 2m3.7-9.3v7.1l-4.4 2.6a4 4 0 0 1-5.3-5.8" />
    </svg>
  );
}
import { motion, AnimatePresence } from "framer-motion";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { dropdownVariants, springs } from "@/lib/animations";
import type { Repository } from "@/types/workspace";

interface NewChatPageProps {
  /** When provided, this page operates in "new worktree" mode for the given repo. */
  repoId?: string;
  onStartChat?: (workspaceId: string, message: string) => void;
}

// ── Model picker data ─────────────────────────────────────────────────────────

interface ModelOption {
  id: string;
  label: string;
  isNew?: boolean;
  isStarred?: boolean;
  isExternal?: boolean;
  shortcut: number;
}

interface ModelGroup {
  label: string;
  provider: "claude" | "codex";
  Logo: React.FC<{ className?: string; style?: React.CSSProperties }>;
  models: ModelOption[];
}

const MODEL_GROUPS: ModelGroup[] = [
  {
    label: "Claude Code",
    provider: "claude",
    Logo: ClaudeIcon,
    models: [
      { id: "claude-opus-4-6-1m", label: "Opus 4.6 1M", isNew: true, shortcut: 1 },
      { id: "claude-opus-4-6", label: "Opus 4.6", shortcut: 2 },
      { id: "claude-sonnet-4-6", label: "Sonnet 4.6", isStarred: true, shortcut: 3 },
      { id: "claude-haiku-4-5", label: "Haiku 4.5", shortcut: 4 },
    ],
  },
  {
    label: "Codex",
    provider: "codex",
    Logo: OpenAIIcon,
    models: [
      { id: "gpt-5.4", label: "GPT-5.4", isNew: true, isExternal: true, shortcut: 5 },
      { id: "gpt-5.3-codex-spark", label: "GPT-5.3-Codex-Spark", isExternal: true, shortcut: 6 },
      { id: "gpt-5.3-codex", label: "GPT-5.3-Codex", isExternal: true, shortcut: 7 },
      { id: "gpt-5.2-codex", label: "GPT-5.2-Codex", isExternal: true, shortcut: 8 },
    ],
  },
];

const DEFAULT_MODEL_ID = "claude-sonnet-4-6";

// ── Model picker dropdown ─────────────────────────────────────────────────────

export function ModelPicker({
  selectedModelId,
  onSelect,
}: {
  selectedModelId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const allModels = MODEL_GROUPS.flatMap((g) => g.models);
  const selected = allModels.find((m) => m.id === selectedModelId) ?? allModels[0];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 8) {
        const model = allModels.find((m) => m.shortcut === n);
        if (model) { onSelect(model.id); setOpen(false); }
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, allModels, onSelect]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors theme-hover-bg"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <span>
          {MODEL_GROUPS.find((g) => g.models.some((m) => m.id === selected.id))?.label} {selected.label}
        </span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-full left-0 z-50 mb-2 w-[300px] overflow-hidden rounded-xl px-[3px] py-2"
            style={{
              backgroundColor: "var(--vscode-dropdown-background, #252526)",
              border: "1px solid var(--vscode-dropdown-border, var(--vscode-panel-border, rgba(128,128,128,0.3)))",
              boxShadow: "0 8px 24px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.15)",
            }}
          >
            {MODEL_GROUPS.map(({ label, Logo, provider, models }, gi) => (
              <div key={label}>
                {gi > 0 && (
                  <div
                    className="my-2"
                    style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.25))" }}
                  />
                )}
                {/* Group header: text only, no left padding */}
                <div className="px-1 pb-1 pt-2">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{ color: "var(--vscode-dropdown-foreground, #cccccc)", opacity: 0.5 }}
                  >
                    {label}
                  </span>
                </div>
                {models.map((model) => {
                  const isSelected = model.id === selectedModelId;
                  return (
                    <button
                      key={model.id}
                      type="button"
                      onClick={() => { onSelect(model.id); setOpen(false); }}
                      className="flex w-[calc(100%-8px)] items-center gap-2 rounded-lg mx-1 px-4 py-2.5 text-left text-[13px] transition-colors"
                      style={{
                        color: isSelected
                          ? "var(--vscode-focusBorder, #007fd4)"
                          : "var(--vscode-dropdown-foreground, #cccccc)",
                        backgroundColor: isSelected ? "var(--vscode-toolbar-hoverBackground, rgba(0,127,212,0.1))" : "transparent",
                        fontWeight: isSelected ? 600 : 400,
                        minHeight: "38px",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.12))";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = isSelected ? "var(--vscode-toolbar-hoverBackground, rgba(0,127,212,0.1))" : "transparent";
                      }}
                    >
                      <Logo
                        className="h-3.5 w-3.5 shrink-0"
                        style={provider === "codex"
                          ? { color: isSelected ? "var(--vscode-focusBorder, #007fd4)" : "var(--vscode-dropdown-foreground, #cccccc)", opacity: isSelected ? 1 : 0.6 }
                          : { opacity: 1 }
                        }
                      />
                      <span className="flex-1 truncate">{model.label}</span>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          color: "var(--vscode-dropdown-foreground, #cccccc)",
                          backgroundColor: "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.12))",
                          opacity: 0.65,
                          letterSpacing: "0.05em",
                        }}
                      >
                        ⌘ M {model.shortcut}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Workspace dropdown ────────────────────────────────────────────────────────

function WorkspaceDropdown({
  repos,
  selectedRepoId,
  onSelect,
}: {
  repos: Repository[];
  selectedRepoId: string | null;
  onSelect: (repoId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectedRepo = repos.find((r) => r.id === selectedRepoId) ?? repos[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors"
        style={{
          backgroundColor: open ? "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.1))" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "var(--vscode-toolbar-hoverBackground, rgba(128,128,128,0.1))";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "transparent";
        }}
      >
        <span
          className="text-base font-semibold leading-tight sm:text-lg md:text-[20px]"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {selectedRepo?.name ?? "Select project"}
        </span>
        <span
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.15s ease" }}
        >
          <ChevronDown
            className="mt-0.5 h-4 w-4"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
          />
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-1/2 top-full z-50 mt-2 w-64 -translate-x-1/2 overflow-hidden rounded-xl py-2"
            style={{
              backgroundColor: "var(--vscode-editorWidget-background, var(--vscode-dropdown-background))",
              border: "1px solid var(--vscode-widget-border, rgba(128,128,128,0.2))",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          >
            <p
              className="px-3 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.45 }}
            >
              Select project
            </p>
            {repos.map((repo) => {
              const isSelected = repo.id === selectedRepo?.id;
              return (
                <motion.button
                  key={repo.id}
                  type="button"
                  onClick={() => { onSelect(repo.id); setOpen(false); }}
                  whileHover={{ backgroundColor: "var(--vscode-toolbar-hover-background)" }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px]"
                  style={{ color: "var(--vscode-dropdown-foreground)" }}
                >
                  <span
                    className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[10px] font-bold"
                    style={{
                      backgroundColor: "var(--vscode-list-inactive-selection-background)",
                      color: "var(--vscode-sidebar-foreground)",
                    }}
                  >
                    {repo.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{repo.name}</span>
                  {isSelected && (
                    <Check className="h-3 w-3 shrink-0" style={{ color: "var(--vscode-list-highlight-foreground)" }} />
                  )}
                </motion.button>
              );
            })}
            <div
              className="mx-2 my-1"
              style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))" }}
            />
            <motion.button
              type="button"
              whileHover={{ backgroundColor: "var(--vscode-toolbar-hover-background)" }}
              className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px]"
              style={{ color: "var(--vscode-tab-inactive-foreground)" }}
              onClick={() => setOpen(false)}
            >
              <span
                className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded"
                style={{ backgroundColor: "var(--vscode-toolbar-hover-background)" }}
              >
                <Plus className="h-3 w-3" />
              </span>
              Add new project
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Suggested prompts ─────────────────────────────────────────────────────────



function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}


// ── NewChatPage ───────────────────────────────────────────────────────────────

export function NewChatPage({ repoId, onStartChat }: NewChatPageProps) {
  const { repos, createWorkspace } = useWorkspaceStore();
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(
    repoId ?? repos[0]?.id ?? null,
  );
  const [branchName, setBranchName] = useState(() => `feature-${Date.now().toString(36)}`);
  const [isCreatingWorktree, setIsCreatingWorktree] = useState(false);

  // Resolve the active repo object
  const activeRepo = repos.find((r) => r.id === (repoId ?? selectedRepoId));
  const worktreePath = activeRepo
    ? `${activeRepo.local_path}/../${activeRepo.name}-${slugify(branchName)}`
    : "";
  const upstream = `origin/${activeRepo?.default_branch ?? "main"}`;

  // Sync selectedRepoId when repoId prop changes
  useEffect(() => {
    if (repoId) setSelectedRepoId(repoId);
  }, [repoId]);

  async function handleSend(message: string) {
    if (!message.trim()) return;
    if (repoId && activeRepo) {
      setIsCreatingWorktree(true);
      try {
        const ws = await createWorkspace({
          repositoryId: activeRepo.id,
          repoPath: activeRepo.local_path,
          cityName: branchName,
          branchName: slugify(branchName),
          baseBranch: activeRepo.default_branch ?? "main",
          model: DEFAULT_MODEL_ID,
        });
        onStartChat?.(ws.id, message.trim());
      } finally {
        setIsCreatingWorktree(false);
      }
    } else if (selectedRepoId) {
      onStartChat?.(selectedRepoId, message.trim());
    }
  }

  return (
    <div
      className="flex h-full flex-col items-center justify-between overflow-hidden"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-0 pb-12 pt-8">
        {/* App Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ ...springs.bouncy, delay: 0.1 }}
          className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--vscode-editorWidget-background, rgba(0,0,0,0.1))",
            border: "1px solid var(--vscode-widget-border, rgba(128,128,128,0.2))",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          <img src="/icon.png" alt="Operator Logo" className="h-full w-full object-cover" />
        </motion.div>

        {/* Headline + workspace picker */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.2 }}
          className="flex flex-col items-center gap-1.5"
        >
          <span
            className="text-[11px] font-semibold tracking-wide"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.8 }}
          >
            New Chat
          </span>
          {repoId && activeRepo ? (
            <span
              className="text-[24px] font-medium sm:text-[28px] md:text-[32px]"
              style={{
                color: "var(--vscode-editor-foreground)",
                letterSpacing: "-0.01em",
              }}
            >
              {activeRepo.name}
            </span>
          ) : (
            <div className="mt-1">
              <WorkspaceDropdown
                repos={repos}
                selectedRepoId={selectedRepoId}
                onSelect={setSelectedRepoId}
              />
            </div>
          )}
        </motion.div>

        {/* Worktree config panel — shown only in repoId mode */}
        {repoId && activeRepo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: 0.15 }}
            className="mt-5 w-full max-w-[420px] rounded-md px-4 py-3"
            style={{
              backgroundColor: "var(--vscode-editorWidget-background, rgba(0,0,0,0.05))",
              border: "1px solid var(--vscode-widget-border, rgba(128,128,128,0.2))",
            }}
          >
            {/* Branch name */}
            <div className="flex items-center gap-2">
              <GitBranch
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
              />
              <span
                className="w-[72px] shrink-0 text-[11px] font-medium uppercase tracking-wider opacity-50"
                style={{ color: "var(--vscode-foreground)" }}
              >
                Branch
              </span>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                className="min-w-0 flex-1 rounded px-2 py-0.5 text-[12px] outline-none"
                style={{
                  background: "var(--vscode-input-background)",
                  border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.08))",
                  color: "var(--vscode-input-foreground)",
                }}
              />
            </div>

            <div
              className="my-2.5"
              style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.06))" }}
            />

            {/* Worktree path */}
            <div className="flex items-center gap-2">
              <FolderGit2
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
              />
              <span
                className="w-[72px] shrink-0 text-[11px] font-medium uppercase tracking-wider opacity-50"
                style={{ color: "var(--vscode-foreground)" }}
              >
                Path
              </span>
              <span
                className="min-w-0 flex-1 truncate text-[11px] font-mono opacity-60"
                style={{ color: "var(--vscode-foreground)" }}
                title={worktreePath}
              >
                {worktreePath}
              </span>
            </div>

            <div
              className="my-2.5"
              style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.06))" }}
            />

            {/* Upstream */}
            <div className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
              >
                <path d="M7 16V4m0 0L3 8m4-4 4 4M17 8v12m0 0 4-4m-4 4-4-4" />
              </svg>
              <span
                className="w-[72px] shrink-0 text-[11px] font-medium uppercase tracking-wider opacity-50"
                style={{ color: "var(--vscode-foreground)" }}
              >
                Upstream
              </span>
              <span
                className="text-[12px] font-mono"
                style={{ color: "var(--vscode-tab-inactive-foreground)" }}
              >
                {upstream}
              </span>
            </div>
          </motion.div>
        )}


      </div>

      {/* ── Composer ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.25 }}
        className="w-full min-w-0 shrink-0"
      >
        <Composer
          onSend={handleSend}
          disabled={isCreatingWorktree}
          loading={isCreatingWorktree}
          className="mx-auto max-w-[720px]"
        />
      </motion.div>
    </div>
  );
}
