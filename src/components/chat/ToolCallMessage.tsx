import { useState } from "react";
import {
  ChevronRight,
  XCircle,
  Loader2,
  Eye,
  FilePlus2,
  FilePen,
  FolderSearch,
  Search,
  Terminal,
  Sparkles,
  Bot,
  Globe,
  FileCode2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolCall {
  id: string;
  tool: string;
  input: string;
  output?: string;
  duration: number;
  status: "success" | "error" | "running";
}

interface ToolCallMessageProps {
  toolCalls: ToolCall[];
  duration?: number;
}

// ── Tool icon map ─────────────────────────────────────────────────────────────

const TOOL_ICONS: Record<string, LucideIcon> = {
  Read: Eye,
  Write: FilePlus2,
  Edit: FilePen,
  Glob: FolderSearch,
  Grep: Search,
  Bash: Terminal,
  Think: Sparkles,
  Thinking: Sparkles,
  Agent: Bot,
  WebFetch: Globe,
  WebSearch: Globe,
};

function getToolIcon(tool: string): LucideIcon {
  return TOOL_ICONS[tool] ?? FileCode2;
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ToolCall["status"] }) {
  if (status === "running")
    return (
      <Loader2
        className="h-3 w-3 shrink-0 animate-spin"
        style={{ color: "var(--vscode-focus-border, #007fd4)" }}
      />
    );
  return (
    <span
      className="h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: status === "error" ? "#f48771" : "#4ec994" }}
    />
  );
}

// ── ToolCallMessage ───────────────────────────────────────────────────────────

export function ToolCallMessage({ toolCalls, duration }: ToolCallMessageProps) {
  const [expanded, setExpanded] = useState(true);
  const errorCount = toolCalls.filter((c) => c.status === "error").length;

  return (
    <div
      className="mb-3 overflow-hidden rounded-md text-[12px]"
      style={{
        border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))",
        backgroundColor: "var(--vscode-sidebar-section-header-background, rgba(0,0,0,0.12))",
      }}
    >
      {/* Summary row / toggle */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3 py-[5px] text-left transition-colors hover:bg-white/3"
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 shrink-0 transition-transform duration-150",
            expanded && "rotate-90",
          )}
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.45 }}
        />
        <span
          className="font-medium"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.7 }}
        >
          {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}
        </span>
        {errorCount > 0 && (
          <span className="flex items-center gap-0.5" style={{ color: "#f48771" }}>
            <XCircle className="h-3 w-3" />
            {errorCount} error{errorCount > 1 ? "s" : ""}
          </span>
        )}
        {duration != null && (
          <span
            className="ml-auto tabular-nums"
            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.4 }}
          >
            {(duration / 1000).toFixed(1)}s
          </span>
        )}
      </button>

      {/* Flat call rows */}
      {expanded && (
        <div
          style={{
            borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.06))",
          }}
        >
          {toolCalls.map((call, i) => {
            const Icon = getToolIcon(call.tool);
            return (
              <div
                key={call.id}
                className={cn("flex items-center gap-2 px-3 py-[5px]")}
                style={{
                  borderBottom:
                    i < toolCalls.length - 1
                      ? "1px solid var(--vscode-panel-border, rgba(255,255,255,0.04))"
                      : undefined,
                }}
              >
                <StatusDot status={call.status} />
                <Icon
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.55 }}
                />
                <span
                  className="shrink-0 font-medium"
                  style={{ color: "var(--vscode-sidebar-foreground)" }}
                >
                  {call.tool}
                </span>
                <span
                  className="min-w-0 flex-1 truncate font-mono"
                  style={{
                    color: "var(--vscode-tab-inactive-foreground)",
                    opacity: 0.6,
                    fontSize: "11px",
                  }}
                >
                  {call.input}
                </span>
                <span
                  className="shrink-0 font-mono tabular-nums"
                  style={{
                    color: "var(--vscode-tab-inactive-foreground)",
                    opacity: 0.3,
                    fontSize: "10px",
                  }}
                >
                  {call.duration}ms
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
