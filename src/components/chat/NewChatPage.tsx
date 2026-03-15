import { useRef, useState, useEffect } from "react";
import {
  ChevronDown,
  Check,
  Plus,
  Gamepad2,
  FileText,
  Lightbulb,
  ArrowUp,
  Paperclip,
  AtSign,
  Star,
  ExternalLink,
  Slash,
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockRepos } from "@/data/mockWorkspaces";
import type { Repo } from "@/types/workspace";

interface NewChatPageProps {
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
        className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/8"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        {selected.label}
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <div
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
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => { onSelect(model.id); setOpen(false); }}
                    className={cn(
                      "mx-1 flex items-center gap-2.5 rounded px-2.5 py-1.5 text-left text-[12px] transition-colors hover:bg-white/8",
                      isSelected && "bg-white/5",
                    )}
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
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Workspace dropdown ────────────────────────────────────────────────────────

function WorkspaceDropdown({
  repos,
  selectedRepoId,
  onSelect,
}: {
  repos: Repo[];
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
        className="flex items-center gap-1.5 rounded-md px-2 py-0.5 transition-colors hover:bg-white/8"
      >
        <span
          className="text-[22px] font-semibold leading-tight"
          style={{ color: "var(--vscode-editor-foreground)" }}
        >
          {selectedRepo?.name ?? "Select project"}
        </span>
        <ChevronDown
          className={cn("mt-0.5 h-4 w-4 transition-transform duration-150", open && "rotate-180")}
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
        />
      </button>

      {open && (
        <div
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
              <button
                key={repo.id}
                type="button"
                onClick={() => { onSelect(repo.id); setOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-white/8"
                style={{ color: "var(--vscode-dropdown-foreground)" }}
              >
                <span
                  className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: "var(--vscode-list-inactive-selection-background)",
                    color: "var(--vscode-sidebar-foreground)",
                  }}
                >
                  {repo.avatarLetter}
                </span>
                <span className="min-w-0 flex-1 truncate">{repo.name}</span>
                {isSelected && (
                  <Check className="h-3 w-3 shrink-0" style={{ color: "var(--vscode-list-highlight-foreground)" }} />
                )}
              </button>
            );
          })}
          <div
            className="mx-2 my-1"
            style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))" }}
          />
          <button
            type="button"
            className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-white/8"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
            onClick={() => setOpen(false)}
          >
            <span
              className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded"
              style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
            >
              <Plus className="h-3 w-3" />
            </span>
            Add new project
          </button>
        </div>
      )}
    </div>
  );
}

// ── Suggested prompts ─────────────────────────────────────────────────────────

const SUGGESTED_PROMPTS = [
  { icon: Gamepad2, label: "Build a classic Snake game in this repo.", accent: "#4ade80" },
  { icon: FileText, label: "Create a one-page PDF summarizing this app.", accent: "#f87171" },
  { icon: Lightbulb, label: "Create a plan to…", accent: "#facc15" },
];

// ── NewChatPage ───────────────────────────────────────────────────────────────

export function NewChatPage({ onStartChat }: NewChatPageProps) {
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(mockRepos[0]?.id ?? null);
  const [message, setMessage] = useState("");
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleSend() {
    if (!message.trim() || !selectedRepoId) return;
    onStartChat?.(selectedRepoId, message.trim());
    setMessage("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  const canSend = message.trim().length > 0;

  return (
    <div
      className="flex h-full flex-col items-center justify-between"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center gap-0 pb-6">
        {/* Operator mark */}
        <div
          className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-[18px] font-bold"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            color: "#fff",
            boxShadow: "0 4px 24px rgba(59,130,246,0.2)",
          }}
        >
          O
        </div>

        {/* Headline + workspace picker */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className="text-[13px]"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.55 }}
          >
            Let&apos;s build
          </span>
          <WorkspaceDropdown
            repos={mockRepos}
            selectedRepoId={selectedRepoId}
            onSelect={setSelectedRepoId}
          />
        </div>

        {/* Suggested prompt cards */}
        <div className="mt-8 flex flex-wrap justify-center gap-2 px-6" style={{ maxWidth: "520px" }}>
          {SUGGESTED_PROMPTS.map((prompt) => {
            const Icon = prompt.icon;
            return (
              <button
                key={prompt.label}
                type="button"
                onClick={() => handleSuggestedPrompt(prompt.label)}
                className="flex w-[155px] items-start gap-2.5 rounded-lg px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-white/5"
                style={{
                  backgroundColor: "var(--vscode-sidebar-background)",
                  border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))",
                  color: "var(--vscode-editor-foreground)",
                }}
              >
                <span
                  className="mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded"
                  style={{ backgroundColor: `${prompt.accent}1a` }}
                >
                  <Icon className="h-3 w-3" style={{ color: prompt.accent }} />
                </span>
                <span className="leading-snug" style={{ opacity: 0.8 }}>
                  {prompt.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="flex items-center gap-1 self-center rounded px-2 py-1 text-[11px] transition-colors hover:bg-white/8"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
          >
            More
            <ChevronDown className="h-3 w-3 -rotate-90" />
          </button>
        </div>
      </div>

      {/* ── Composer ──────────────────────────────────────────────────── */}
      <div
        className="w-full shrink-0"
        style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))" }}
      >
        <div className="mx-auto w-full max-w-[720px] px-5 pt-3 pb-2">
          {/* Input box */}
          <div
            className="rounded-lg px-3 pt-2.5 pb-1.5"
            style={{
              backgroundColor: "var(--vscode-input-background)",
              border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.10))",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Operator anything, @ to add files, / for commands…"
              rows={1}
              className="vscode-scrollable w-full resize-none bg-transparent text-[13px] leading-relaxed placeholder:opacity-40 focus:outline-none"
              style={{
                color: "var(--vscode-input-foreground)",
                minHeight: "22px",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            />
            {/* Keyboard hint */}
            {!canSend && (
              <div
                className="mt-1 flex items-center justify-end pb-0.5 text-[10px]"
                style={{ color: "var(--vscode-input-placeholder-foreground)", opacity: 0.45 }}
              >
                <kbd
                  className="rounded px-1 py-px font-mono"
                  style={{ border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.1))" }}
                >
                  ↵
                </kbd>
                <span className="ml-1">to send</span>
              </div>
            )}
          </div>
        </div>

        {/* Toolbar row */}
        <div className="mx-auto flex w-full max-w-[720px] items-center gap-1 px-5 pb-2">
          <div className="flex flex-1 items-center gap-0.5">
            {/* Attach */}
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
              style={{ color: "var(--vscode-editor-foreground)", opacity: 0.5 }}
              title="Add attachment"
            >
              <Paperclip className="h-3.5 w-3.5" />
            </button>

            {/* Mention */}
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
              style={{ color: "var(--vscode-editor-foreground)", opacity: 0.5 }}
              title="Mention a file"
            >
              <AtSign className="h-3.5 w-3.5" />
            </button>

            <ModelPicker selectedModelId={selectedModelId} onSelect={setSelectedModelId} />

            {/* Slash commands */}
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--vscode-editor-foreground)", opacity: 0.4 }}
              title="Slash commands"
            >
              <Slash className="h-3 w-3" />
              Commands
            </button>
          </div>

          {/* Send */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              "flex h-[28px] w-[28px] items-center justify-center rounded-lg transition-all duration-150",
              canSend ? "opacity-100 hover:brightness-110 active:scale-95" : "cursor-not-allowed opacity-20",
            )}
            style={{
              backgroundColor: canSend
                ? "var(--vscode-focus-border, #007fd4)"
                : "rgba(255,255,255,0.08)",
              color: "#fff",
            }}
            title="Send (↵)"
          >
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Status row */}
        <div
          className="mx-auto flex w-full max-w-[720px] items-center justify-between px-5 py-1.5"
          style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.06))" }}
        >
          <div className="flex items-center gap-0.5">
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
              style={{ color: "var(--vscode-editor-foreground)", opacity: 0.55 }}
            >
              <Cpu className="h-3 w-3" />
              Local
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </div>
          <span
            className="text-[10px] tabular-nums"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.35 }}
          >
            80k / 200k ctx
          </span>
        </div>
      </div>
    </div>
  );
}
