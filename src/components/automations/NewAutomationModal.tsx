import { useState, useEffect } from "react";
import {
  Asterisk,
  Brain,
  ChevronDown,
  Clock,
  FolderOpen,
  Plus,
  X,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ModelId } from "@/components/composer/ModelPicker";
import type { ThinkingLevel } from "@/components/composer/ReasoningPicker";

// ── Constants ───────────────────────────────────────────────────────────────

const MODELS = [
  { id: "claude-sonnet-4-6" as ModelId, label: "Claude Sonnet 4.6", badge: "Fast" },
  { id: "claude-opus-4-6" as ModelId, label: "Claude Opus 4.6", badge: "Powerful" },
  { id: "claude-opus-4-6-1m" as ModelId, label: "Claude Opus 4.6 1M", badge: "1M ctx" },
  { id: "claude-haiku-3-5" as ModelId, label: "Claude Haiku 3.5", badge: "Lite" },
  { id: "gpt-5-4" as ModelId, label: "GPT-5.4", badge: "New" },
  { id: "gpt-5-3-codex-spark" as ModelId, label: "GPT-5.3 Codex Spark" },
  { id: "gpt-5-3-codex" as ModelId, label: "GPT-5.3 Codex" },
  { id: "gpt-5-2-codex" as ModelId, label: "GPT-5.2 Codex" },
];

const SHORT_MODEL: Record<ModelId, string> = {
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-opus-4-6": "Opus 4.6",
  "claude-opus-4-6-1m": "Opus 4.6 1M",
  "claude-haiku-3-5": "Haiku 3.5",
  "gpt-5-4": "GPT-5.4",
  "gpt-5-3-codex-spark": "GPT-5.3 Spark",
  "gpt-5-3-codex": "GPT-5.3 Codex",
  "gpt-5-2-codex": "GPT-5.2 Codex",
};

const SCHEDULES = [
  { id: "daily-9am", label: "Daily at 9:00 AM" },
  { id: "daily-6am", label: "Daily at 6:00 AM" },
  { id: "weekly-mon", label: "Every Monday at 9:00 AM" },
  { id: "weekly-fri", label: "Every Friday at 5:00 PM" },
  { id: "hourly", label: "Every hour" },
  { id: "custom", label: "Custom schedule…" },
];

const REASONING_OPTIONS = [
  { id: "off" as ThinkingLevel, label: "Off", description: "No extended thinking" },
  { id: "low" as ThinkingLevel, label: "Low", description: "Quick reasoning pass" },
  { id: "medium" as ThinkingLevel, label: "Medium", description: "Balanced depth" },
  { id: "high" as ThinkingLevel, label: "High", description: "Deep reasoning" },
];

const EXAMPLE_PROJECTS = ["my-app", "backend-api", "design-system", "data-pipeline"];

// ── Shared styles ────────────────────────────────────────────────────────────

const dropdownStyle: React.CSSProperties = {
  backgroundColor: "var(--vscode-dropdown-background)",
  border: "1px solid var(--vscode-dropdown-border, var(--vscode-panel-border))",
  color: "var(--vscode-dropdown-foreground)",
  borderRadius: "6px",
  fontSize: "12px",
};

// ── ToolbarPicker ────────────────────────────────────────────────────────────

function ToolbarPicker({
  icon: Icon,
  label,
  active,
  children,
}: {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-[28px] items-center gap-1.5 rounded-[4px] px-2.5 text-[11px] transition-all duration-75",
          )}
          style={{
            color: active ? "var(--vscode-textLink-foreground)" : "var(--vscode-foreground)",
            opacity: active ? 1 : 0.7,
            background: active ? "var(--vscode-toolbar-hover-background)" : "transparent",
          }}
          onMouseEnter={(e) => {
            if (!active) e.currentTarget.style.background = "var(--vscode-toolbar-hover-background)";
          }}
          onMouseLeave={(e) => {
            if (!active) e.currentTarget.style.background = "transparent";
          }}
        >
          <Icon className="h-3 w-3 shrink-0" />
          <span className={cn("max-w-[120px] truncate", active && "font-medium")}>{label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[200px]" style={dropdownStyle}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolbarSep() {
  return (
    <span
      className="mx-1 h-3.5 w-px shrink-0"
      style={{ background: "var(--vscode-panel-border)" }}
    />
  );
}

// ── NewAutomationModal ───────────────────────────────────────────────────────

interface NewAutomationModalProps {
  open: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

export function NewAutomationModal({ open, onClose, initialPrompt = "" }: NewAutomationModalProps) {
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState(initialPrompt);
  const [project, setProject] = useState<string | null>(null);
  const [schedule, setSchedule] = useState("daily-9am");
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const [reasoning, setReasoning] = useState<ThinkingLevel>("off");

  // Sync initialPrompt when it changes (e.g. from template)
  useEffect(() => {
    setPrompt(initialPrompt);
  }, [initialPrompt]);

  function handleClose() {
    setTitle("");
    setPrompt("");
    setProject(null);
    setSchedule("daily-9am");
    setModel("claude-sonnet-4-6");
    setReasoning("off");
    onClose();
  }

  const scheduleLabel = SCHEDULES.find((s) => s.id === schedule)?.label ?? "Daily at 9:00 AM";
  const canCreate = title.trim().length > 0 && prompt.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent
        className="w-[600px] max-w-[95vw] overflow-hidden p-0"
        style={{
          background: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-panel-border)",
          borderRadius: "8px",
          boxShadow: "0 12px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          color: "var(--vscode-editor-foreground)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <DialogHeader
          className="flex flex-row items-center justify-between px-5 py-3.5"
          style={{ borderBottom: "1px solid var(--vscode-panel-border)" }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-[5px]"
              style={{
                background: "linear-gradient(135deg, rgba(55,148,255,0.15), rgba(178,103,230,0.15))",
                border: "1px solid rgba(55,148,255,0.2)",
              }}
            >
              <Zap className="h-3.5 w-3.5" style={{ color: "var(--vscode-textLink-foreground, #3794ff)" }} />
            </div>
            <DialogTitle
              className="text-[13px] font-semibold"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              New Automation
            </DialogTitle>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-[24px] w-[24px] items-center justify-center rounded-[4px] transition-all duration-75"
            style={{ color: "var(--vscode-icon-foreground)", opacity: 0.5 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = "0.9";
              e.currentTarget.style.background = "var(--vscode-toolbar-hover-background)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = "0.5";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-5 py-4">

          {/* ── Title input ────────────────────────────────────────── */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.04em]"
              style={{ color: "var(--vscode-descriptionForeground)", opacity: 0.7 }}
            >
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Daily standup summary"
              autoFocus
              className="w-full rounded-[4px] px-3 py-[7px] text-[13px] outline-none transition-colors duration-75"
              style={{
                background: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: `1px solid ${title ? "var(--vscode-focusBorder, #0078d4)" : "var(--vscode-input-border, var(--vscode-panel-border))"}`,
              }}
            />
          </div>

          {/* ── Prompt textarea ───────────────────────────────────── */}
          <div>
            <label
              className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.04em]"
              style={{ color: "var(--vscode-descriptionForeground)", opacity: 0.7 }}
            >
              Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what this automation should do…"
              rows={5}
              className="w-full resize-none rounded-[4px] px-3 py-2.5 text-[12px] leading-[1.6] outline-none transition-colors duration-75"
              style={{
                background: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: `1px solid ${prompt ? "var(--vscode-focusBorder, #0078d4)" : "var(--vscode-input-border, var(--vscode-panel-border))"}`,
              }}
            />
          </div>

          {/* ── Config toolbar ─────────────────────────────────────── */}
          <div
            className="flex flex-wrap items-center gap-1 rounded-[4px] px-1.5 py-1.5"
            style={{
              background: "var(--vscode-toolbar-hover-background)",
              border: "1px solid var(--vscode-panel-border)",
            }}
          >
            {/* Project */}
            <ToolbarPicker icon={FolderOpen} label={project ?? "Project"} active={!!project}>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                Project
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-panel-border)" }} />
              {EXAMPLE_PROJECTS.map((p) => (
                <DropdownMenuItem
                  key={p}
                  onClick={() => setProject(p)}
                  className="text-[12px]"
                  style={{ background: project === p ? "var(--vscode-list-active-selection-background)" : undefined }}
                >
                  {p}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-panel-border)" }} />
              <DropdownMenuItem className="text-[12px] opacity-60" onClick={() => setProject(null)}>
                No project
              </DropdownMenuItem>
            </ToolbarPicker>

            <ToolbarSep />

            {/* Schedule */}
            <ToolbarPicker icon={Clock} label={scheduleLabel} active>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                Schedule
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-panel-border)" }} />
              {SCHEDULES.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => setSchedule(s.id)}
                  className="text-[12px]"
                  style={{ background: schedule === s.id ? "var(--vscode-list-active-selection-background)" : undefined }}
                >
                  {s.label}
                </DropdownMenuItem>
              ))}
            </ToolbarPicker>

            <ToolbarSep />

            {/* Model */}
            <ToolbarPicker icon={Asterisk} label={SHORT_MODEL[model]}>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                Model
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-panel-border)" }} />
              {MODELS.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className="flex items-center justify-between gap-4 text-[12px]"
                  style={{ background: model === m.id ? "var(--vscode-list-active-selection-background)" : undefined }}
                >
                  <span>{m.label}</span>
                  {m.badge && (
                    <span
                      className="rounded-[3px] px-1.5 py-[1px] text-[10px]"
                      style={{
                        background: "var(--vscode-toolbar-hover-background)",
                        color: "var(--vscode-descriptionForeground)",
                        border: "1px solid var(--vscode-panel-border)",
                      }}
                    >
                      {m.badge}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </ToolbarPicker>

            <ToolbarSep />

            {/* Reasoning */}
            <ToolbarPicker
              icon={Brain}
              active={reasoning !== "off"}
              label={
                reasoning === "off"
                  ? "Thinking"
                  : (REASONING_OPTIONS.find((o) => o.id === reasoning)?.label ?? "Off")
              }
            >
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                Extended Thinking
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-panel-border)" }} />
              {REASONING_OPTIONS.map((opt) => (
                <DropdownMenuItem
                  key={opt.id}
                  onClick={() => setReasoning(opt.id)}
                  className="flex flex-col items-start gap-0.5"
                  style={{ background: reasoning === opt.id ? "var(--vscode-list-active-selection-background)" : undefined }}
                >
                  <span className="text-[12px] font-medium">{opt.label}</span>
                  <span className="text-[10px] opacity-50">{opt.description}</span>
                </DropdownMenuItem>
              ))}
            </ToolbarPicker>
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────── */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3"
          style={{ borderTop: "1px solid var(--vscode-panel-border)" }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="vscode-btn vscode-btn-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canCreate}
            className="vscode-btn vscode-btn-primary flex items-center gap-1.5"
          >
            <Plus className="h-3 w-3" />
            Create automation
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
