import { useRef, useState, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Plus,
  Gamepad2,
  FileText,
  Lightbulb,
  ArrowUp,
  Star,
  ExternalLink,
  Brain,
  Map,
  GitBranch,
  FolderGit2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { staggerContainer, staggerItemScale, dropdownVariants, springs } from "@/lib/animations";
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
  models: ModelOption[];
}

const MODEL_GROUPS: ModelGroup[] = [
  {
    label: "Claude Code",
    provider: "claude",
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
    models: [
      { id: "gpt-5.4", label: "GPT-5.4", isNew: true, isExternal: true, shortcut: 5 },
      { id: "gpt-5.3-codex-spark", label: "GPT-5.3-Codex-Spark", isExternal: true, shortcut: 6 },
      { id: "gpt-5.3-codex", label: "GPT-5.3-Codex", isExternal: true, shortcut: 7 },
      { id: "gpt-5.2-codex", label: "GPT-5.2-Codex", isExternal: true, shortcut: 8 },
    ],
  },
];

const DEFAULT_MODEL_ID = "claude-sonnet-4-6";

// ── Brand icons ───────────────────────────────────────────────────────────────

function AnthropicIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2L13.5 8.5L20 7L15.5 12L20 17L13.5 15.5L12 22L10.5 15.5L4 17L8.5 12L4 7L10.5 8.5L12 2Z" />
    </svg>
  );
}

function OpenAIIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.843-3.372 2.02-1.164a.08.08 0 0 1 .071 0l4.83 2.786a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.402-.677zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z" />
    </svg>
  );
}

// ── Model picker dropdown ─────────────────────────────────────────────────────

function ModelPicker({
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
        className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors theme-hover-bg"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        {selected.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-full left-0 z-50 mb-1.5 w-64 overflow-hidden rounded-lg py-1.5 shadow-2xl"
            style={{
              backgroundColor: "var(--vscode-dropdown-background)",
              border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.10))",
            }}
          >
            {MODEL_GROUPS.map((group, gi) => (
              <div key={group.label}>
                {gi > 0 && (
                  <div
                    className="mx-2 my-1"
                    style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))" }}
                  />
                )}
                <p
                  className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.5 }}
                >
                  {group.label}
                </p>
                {group.models.map((model) => {
                  const isSelected = model.id === selectedModelId;
                  const Icon = group.provider === "claude" ? AnthropicIcon : OpenAIIcon;
                  return (
                    <motion.button
                      key={model.id}
                      type="button"
                      onClick={() => { onSelect(model.id); setOpen(false); }}
                      whileHover={{ backgroundColor: "var(--vscode-toolbar-hover-background)" }}
                      whileTap={{ scale: 0.98 }}
                      className="mx-1 flex items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-[12px]"
                      style={{
                        color: "var(--vscode-dropdown-foreground)",
                        width: "calc(100% - 8px)",
                      }}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      <span className="flex-1 truncate">{model.label}</span>
                      {model.isExternal && <ExternalLink className="h-3 w-3 shrink-0 opacity-35" />}
                      {model.isNew && (
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold"
                          style={{ backgroundColor: "rgba(220,100,80,0.2)", color: "#e07060" }}
                        >
                          NEW
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-3 w-3 shrink-0" style={{ color: "var(--vscode-list-highlight-foreground)" }} />
                      )}
                      {model.isStarred && !isSelected && (
                        <Star className="h-3 w-3 shrink-0" style={{ color: "#facc15", fill: "#facc15" }} />
                      )}
                      <span className="w-4 shrink-0 text-right text-[10px]" style={{ opacity: 0.3 }}>
                        {model.shortcut}
                      </span>
                    </motion.button>
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
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-1.5 rounded-md px-2 py-0.5"
      >
        <span
          className="text-base font-semibold leading-tight sm:text-lg md:text-[22px]"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {selectedRepo?.name ?? "Select project"}
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={springs.snappy}
        >
          <ChevronDown
            className="mt-0.5 h-4 w-4"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
          />
        </motion.span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-1/2 top-full z-50 mt-1.5 w-56 -translate-x-1/2 overflow-hidden rounded-lg py-1 shadow-xl"
            style={{
              backgroundColor: "var(--vscode-dropdown-background)",
              border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.10))",
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

const SUGGESTED_PROMPTS = [
  { icon: Gamepad2, label: "Build a classic Snake game in this repo.", accent: "#4ade80", category: "Build" },
  { icon: FileText, label: "Create a one-page PDF summarizing this app.", accent: "#f87171", category: "Document" },
  { icon: Lightbulb, label: "Create a plan to…", accent: "#facc15", category: "Plan" },
];

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// ── Thinking helpers ──────────────────────────────────────────────────────────

type ThinkingLevel = "off" | "low" | "medium" | "high";

function ThinkingRects({ level }: { level: ThinkingLevel }) {
  const counts: Record<ThinkingLevel, number> = { off: 0, low: 1, medium: 2, high: 3 };
  const count = counts[level];
  if (count === 0) return null;
  return (
    <span className="flex items-center gap-[2px]">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className="inline-block rounded-[1px]"
          style={{
            width: "3px",
            height: i < count ? "10px" : "6px",
            backgroundColor: "currentColor",
            opacity: i < count ? 1 : 0.2,
          }}
        />
      ))}
    </span>
  );
}

function RadialContextIndicator({ percentage = 0 }: { percentage?: number }) {
  const r = 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-md transition-colors theme-hover-bg"
      style={{ color: "var(--vscode-icon-foreground)" }}
      title={`${percentage}% context used`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r={r} stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        {percentage > 0 && (
          <circle
            cx="9" cy="9" r={r}
            stroke="currentColor" strokeWidth="1.5"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 9 9)"
          />
        )}
      </svg>
    </button>
  );
}

function ComposerThinkingPicker({
  value,
  onChange,
}: {
  value: ThinkingLevel;
  onChange: (v: ThinkingLevel) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = value !== "off";
  const OPTIONS: { id: ThinkingLevel; label: string }[] = [
    { id: "off", label: "Off" },
    { id: "low", label: "Low" },
    { id: "medium", label: "Medium" },
    { id: "high", label: "High" },
  ];

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors theme-hover-bg"
        style={{
          color: isActive ? "var(--vscode-focus-border, #007fd4)" : "var(--vscode-tab-inactive-foreground)",
          backgroundColor: isActive ? "rgba(0,127,212,0.12)" : undefined,
        }}
      >
        <Brain className="h-3.5 w-3.5" />
        {value === "off" ? "Thinking" : OPTIONS.find((o) => o.id === value)?.label}
        {isActive && <ThinkingRects level={value} />}
        <ChevronDown className="h-2.5 w-2.5 opacity-40" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute bottom-full left-0 z-50 mb-1.5 w-44 overflow-hidden rounded-lg py-1.5 shadow-2xl"
            style={{
              backgroundColor: "var(--vscode-dropdown-background)",
              border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.10))",
            }}
          >
            <p
              className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.5 }}
            >
              Extended Thinking
            </p>
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onChange(opt.id); setOpen(false); }}
                className="flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] transition-colors theme-hover-bg"
                style={{
                  color: "var(--vscode-dropdown-foreground)",
                  backgroundColor: value === opt.id ? "var(--vscode-toolbar-hover-background)" : undefined,
                }}
              >
                <span>{opt.label}</span>
                <ThinkingRects level={opt.id} />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── NewChatPage ───────────────────────────────────────────────────────────────

export function NewChatPage({ repoId, onStartChat }: NewChatPageProps) {
  const { repos, createWorkspace } = useWorkspaceStore();
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(
    repoId ?? repos[0]?.id ?? null,
  );
  const [message, setMessage] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [composerFocused, setComposerFocused] = useState(false);
  const [branchName, setBranchName] = useState(() => `feature-${Date.now().toString(36)}`);
  const [isCreatingWorktree, setIsCreatingWorktree] = useState(false);
  const [thinking, setThinking] = useState<ThinkingLevel>("off");
  const [planMode, setPlanMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleSend() {
    if (!message.trim()) return;
    if (repoId && activeRepo) {
      // Worktree mode: create the worktree first, then start chat
      setIsCreatingWorktree(true);
      try {
        const ws = await createWorkspace({
          repositoryId: activeRepo.id,
          repoPath: activeRepo.local_path,
          cityName: branchName,
          branchName: slugify(branchName),
          baseBranch: activeRepo.default_branch ?? "main",
          model: selectedModelId,
        });
        onStartChat?.(ws.id, message.trim());
        setMessage("");
      } finally {
        setIsCreatingWorktree(false);
      }
    } else if (selectedRepoId) {
      onStartChat?.(selectedRepoId, message.trim());
      setMessage("");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handleSuggestedPrompt(label: string) {
    setMessage(label);
    textareaRef.current?.focus();
  }

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [message]);

  const canSend = message.trim().length > 0 && !isCreatingWorktree;

  return (
    <div
      className="flex h-full flex-col items-center justify-between overflow-hidden"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-0 pb-6">
        {/* Floating gradient orb */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <div
            className="h-[400px] w-[400px] rounded-full opacity-[0.06] blur-[100px] animate-float animate-gradientShift"
            style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)" }}
          />
        </div>

        {/* Operator mark */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={springs.bouncy}
          className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-[20px] font-bold gradient-accent animate-gradientShift"
          style={{
            color: "#fff",
            boxShadow: "0 8px 32px rgba(59,130,246,0.30), 0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          O
        </motion.div>

        {/* Headline + workspace picker */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.smooth, delay: 0.1 }}
          className="flex flex-col items-center gap-1"
        >
          <span
            className="text-[12px] font-medium tracking-widest uppercase"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.45, letterSpacing: "0.12em" }}
          >
            Let&apos;s build
          </span>
          {repoId && activeRepo ? (
            <span
              className="text-[20px] font-semibold sm:text-[22px] md:text-[26px]"
              style={{ color: "var(--vscode-editor-foreground)", letterSpacing: "-0.01em" }}
            >
              {activeRepo.name}
            </span>
          ) : (
            <WorkspaceDropdown
              repos={repos}
              selectedRepoId={selectedRepoId}
              onSelect={setSelectedRepoId}
            />
          )}
        </motion.div>

        {/* Worktree config panel — shown only in repoId mode */}
        {repoId && activeRepo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: 0.15 }}
            className="mt-5 w-full max-w-[420px] rounded-lg px-4 py-3"
            style={{
              backgroundColor: "var(--vscode-sidebar-background)",
              border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))",
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

        {/* Suggested prompt cards */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="mt-8 flex flex-col items-center gap-3 px-4 sm:mt-10 sm:px-6"
          style={{ maxWidth: "600px", width: "100%" }}
        >
          {/* Cards row */}
          <div className="flex w-full flex-wrap justify-center gap-3">
            {SUGGESTED_PROMPTS.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <motion.button
                  key={prompt.label}
                  variants={staggerItemScale}
                  type="button"
                  onClick={() => handleSuggestedPrompt(prompt.label)}
                  whileHover={{ scale: 1.02, y: -3 }}
                  whileTap={{ scale: 0.98 }}
                  className="group flex min-w-[160px] max-w-[185px] flex-1 flex-col gap-3 rounded-xl p-4 text-left transition-all duration-200"
                  style={{
                    backgroundColor: "var(--vscode-editorWidget-background, var(--vscode-sidebar-background))",
                    border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.08))",
                    color: "var(--vscode-editor-foreground)",
                    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
                  }}
                >
                  {/* Icon + category row */}
                  <div className="flex items-center justify-between">
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${prompt.accent}22`,
                        border: `1px solid ${prompt.accent}33`,
                      }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: prompt.accent }} />
                    </span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        backgroundColor: `${prompt.accent}15`,
                        color: prompt.accent,
                        opacity: 0.85,
                      }}
                    >
                      {prompt.category}
                    </span>
                  </div>
                  {/* Label */}
                  <span
                    className="text-[12px] leading-snug"
                    style={{ color: "var(--vscode-editor-foreground)", opacity: 0.75 }}
                  >
                    {prompt.label}
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* More button */}
          <motion.button
            variants={staggerItemScale}
            type="button"
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors theme-hover-bg"
            style={{
              color: "var(--vscode-tab-inactive-foreground)",
              opacity: 0.5,
              border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.06))",
            }}
          >
            More suggestions
            <ChevronDown className="h-3 w-3 -rotate-90" />
          </motion.button>
        </motion.div>
      </div>

      {/* ── Composer ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.2 }}
        className="w-full min-w-0 shrink-0 px-3 pb-3 sm:px-5"
      >
        <div
          className="mx-auto w-full max-w-[720px] overflow-hidden rounded-xl"
          style={{
            backgroundColor: "var(--vscode-input-background)",
            border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.10))",
            boxShadow: composerFocused
              ? "0 0 0 1px var(--vscode-focus-border), 0 0 12px rgba(0,127,212,0.15)"
              : "none",
          }}
        >
          {/* Textarea */}
          <div className="px-3.5 pt-3 pb-1">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setComposerFocused(true)}
              onBlur={() => setComposerFocused(false)}
              placeholder="Ask for code changes, @mention files, run /slash commands or add /skills"
              rows={1}
              className="vscode-scrollable w-full resize-none bg-transparent text-[13px] leading-relaxed placeholder:opacity-40 focus:outline-none"
              style={{
                color: "var(--vscode-input-foreground)",
                minHeight: "22px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            />
          </div>

          {/* Toolbar row */}
          <div className="flex items-center gap-0.5 px-2 pb-2.5 pt-1">
            {/* Left: model, thinking, plan */}
            <ModelPicker selectedModelId={selectedModelId} onSelect={setSelectedModelId} />
            <ComposerThinkingPicker value={thinking} onChange={setThinking} />
            <button
              type="button"
              onClick={() => setPlanMode((v) => !v)}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors theme-hover-bg"
              style={{
                color: planMode ? "var(--vscode-focus-border, #007fd4)" : "var(--vscode-tab-inactive-foreground)",
                backgroundColor: planMode ? "rgba(0,127,212,0.12)" : undefined,
              }}
              title="Toggle Plan mode"
            >
              <Map className="h-3.5 w-3.5" />
              Plan
            </button>

            <div className="flex-1" />

            {/* Right: context radial, attach, send */}
            <RadialContextIndicator percentage={0} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors theme-hover-bg"
              style={{ color: "var(--vscode-tab-inactive-foreground)" }}
              title="Add attachment"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
            <input ref={fileInputRef} type="file" multiple className="hidden" />

            <motion.button
              type="button"
              onClick={() => void handleSend()}
              disabled={!canSend}
              whileHover={canSend ? { scale: 1.08 } : undefined}
              whileTap={canSend ? { scale: 0.9 } : undefined}
              transition={springs.snappy}
              className={cn(
                "ml-0.5 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150",
                canSend ? "cursor-pointer opacity-100" : "cursor-not-allowed opacity-40",
              )}
              style={{
                backgroundColor: canSend
                  ? "var(--vscode-button-background, var(--vscode-focus-border, #007fd4))"
                  : "var(--vscode-toolbar-hover-background)",
                color: canSend ? "var(--vscode-button-foreground, #fff)" : "var(--vscode-icon-foreground)",
              }}
              title={isCreatingWorktree ? "Creating worktree…" : "Send (↵)"}
            >
              {isCreatingWorktree ? (
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
