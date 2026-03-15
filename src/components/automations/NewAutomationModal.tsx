import { useState } from "react";
import {
  Asterisk,
  Brain,
  ChevronDown,
  Clock,
  FolderOpen,
  GitBranch,
  X,
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
  { id: "claude-opus-4-6" as ModelId, label: "Claude Opus 4.6", badge: "Powerful" },
  { id: "claude-sonnet-4-6" as ModelId, label: "Claude Sonnet 4.6", badge: "Fast" },
  { id: "claude-haiku-4-5" as ModelId, label: "Claude Haiku 4.5", badge: "Lite" },
  { id: "gpt-4o" as ModelId, label: "GPT 4o" },
  { id: "gemini-2-5-pro" as ModelId, label: "Gemini 2.5 Pro" },
];

const SHORT_MODEL: Record<ModelId, string> = {
  "claude-opus-4-6": "Opus 4.6",
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-haiku-4-5": "Haiku 4.5",
  "gpt-4o": "GPT 4o",
  "gemini-2-5-pro": "Gemini 2.5",
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
  borderRadius: "3px",
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
            "flex h-[26px] items-center gap-1 rounded-[3px] px-2 text-[11px] theme-hover-bg transition-colors duration-75",
          )}
          style={{
            color: active ? "var(--vscode-focus-border, #007fd4)" : "var(--vscode-foreground)",
            opacity: active ? 1 : 0.75,
          }}
        >
          <Icon className="h-3 w-3 shrink-0" />
          <span className={cn(active && "font-medium")}>{label}</span>
          <ChevronDown className="h-2.5 w-2.5 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[180px]" style={dropdownStyle}>
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ToolbarSep() {
  return (
    <span
      className="mx-0.5 h-3.5 w-px shrink-0"
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

  function handleClose() {
    setTitle("");
    setPrompt(initialPrompt);
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
          borderRadius: "6px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          color: "var(--vscode-editor-foreground)",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <DialogHeader
          className="flex flex-row items-center justify-between px-4 py-3"
          style={{ borderBottom: "1px solid var(--vscode-panel-border)" }}
        >
          <DialogTitle
            className="text-[13px] font-semibold"
            style={{ color: "var(--vscode-editor-foreground)" }}
          >
            New Automation
          </DialogTitle>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-[22px] w-[22px] items-center justify-center rounded-[3px] theme-hover-bg"
            style={{ color: "var(--vscode-icon-foreground)", opacity: 0.7 }}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-3 p-4">

          {/* ── Worktree callout ──────────────────────────────────── */}
          <div
            className="flex items-start gap-2 rounded-[3px] px-3 py-2 text-[11px]"
            style={{
              background: "var(--vscode-toolbar-hover-background)",
              borderLeft: "2px solid var(--vscode-focus-border, #007fd4)",
              color: "var(--vscode-descriptionForeground)",
            }}
          >
            <GitBranch className="mt-px h-3 w-3 shrink-0" style={{ color: "var(--vscode-focus-border)" }} />
            <span>
              By default, automations run in{" "}
              <strong style={{ color: "var(--vscode-editor-foreground)" }}>independent worktrees</strong>
              {" "}— each run is isolated on its own branch, so your main workspace is never disrupted.
            </span>
          </div>

          {/* ── Title row ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Automation title"
              autoFocus
              className="min-w-0 flex-1 rounded-[3px] px-3 py-[6px] text-[13px] outline-none focus:ring-1"
              style={{
                background: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: "1px solid var(--vscode-input-border)",
              }}
            />
            <button
              type="button"
              className="shrink-0 rounded-[3px] px-3 py-[6px] text-[11px] font-medium transition-opacity duration-75 hover:opacity-90"
              style={{
                background: "var(--vscode-button-secondaryBackground)",
                color: "var(--vscode-button-secondaryForeground)",
                border: "1px solid var(--vscode-panel-border)",
              }}
            >
              Use template
            </button>
          </div>

          {/* ── Prompt textarea ───────────────────────────────────── */}
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe what this automation should do…"
            rows={5}
            className="w-full resize-none rounded-[3px] px-3 py-2.5 text-[12px] leading-relaxed outline-none"
            style={{
              background: "var(--vscode-input-background)",
              color: "var(--vscode-input-foreground)",
              border: "1px solid var(--vscode-input-border)",
            }}
          />

          {/* ── Toolbar row ───────────────────────────────────────── */}
          <div
            className="flex flex-wrap items-center gap-0.5"
            style={{ borderTop: "1px solid var(--vscode-panel-border)", paddingTop: "8px" }}
          >
            {/* Project */}
            <ToolbarPicker icon={FolderOpen} label={project ?? "Select project"}>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                Project
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
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
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
              <DropdownMenuItem className="text-[12px] opacity-60" onClick={() => setProject(null)}>
                No project
              </DropdownMenuItem>
            </ToolbarPicker>

            <ToolbarSep />

            {/* Schedule */}
            <ToolbarPicker icon={Clock} label={scheduleLabel}>
              <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
                Schedule
              </DropdownMenuLabel>
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
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
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
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
                      className="text-[10px] opacity-60"
                      style={{
                        background: "var(--vscode-toolbar-hover-background)",
                        borderRadius: "2px",
                        padding: "0 4px",
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
              <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
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

            {/* Push actions to the right */}
            <div className="flex-1" />

            <button
              type="button"
              onClick={handleClose}
              className="rounded-[3px] px-3 py-1 text-[12px] transition-opacity duration-75 hover:opacity-80"
              style={{ color: "var(--vscode-foreground)", opacity: 0.6 }}
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!canCreate}
              className="ml-1 rounded-[3px] px-3 py-1 text-[12px] font-medium transition-opacity duration-75 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
              style={{
                background: "var(--vscode-button-background)",
                color: "var(--vscode-button-foreground)",
              }}
            >
              Create
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
