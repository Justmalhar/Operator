import { useState } from "react";
import { ChevronRight, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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

function StatusIcon({ status }: { status: ToolCall["status"] }) {
  if (status === "success") return <CheckCircle2 className="h-3 w-3 shrink-0" style={{ color: "#4ec994" }} />;
  if (status === "error") return <XCircle className="h-3 w-3 shrink-0" style={{ color: "#f48771" }} />;
  return <Loader2 className="h-3 w-3 shrink-0 animate-spin" style={{ color: "#3b9edd" }} />;
}

export function ToolCallMessage({ toolCalls, duration }: ToolCallMessageProps) {
  const [expanded, setExpanded] = useState(false);
  const [expandedCalls, setExpandedCalls] = useState<Set<string>>(new Set());

  function toggleCall(id: string) {
    setExpandedCalls((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const successCount = toolCalls.filter((c) => c.status === "success").length;
  const errorCount = toolCalls.filter((c) => c.status === "error").length;

  return (
    <div
      className="mb-2 overflow-hidden rounded-md"
      style={{
        backgroundColor: "var(--vscode-list-inactive-selection-background)",
        border: "1px solid var(--vscode-sidebar-section-header-border, transparent)",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-3 py-[6px] text-left transition-colors hover:bg-white/3"
      >
        <ChevronRight
          className={cn("h-3 w-3 shrink-0 transition-transform duration-150", expanded && "rotate-90")}
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
        />
        <span className="text-[12px] font-medium" style={{ color: "var(--vscode-sidebar-foreground)" }}>
          {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}
        </span>
        {successCount > 0 && (
          <span className="flex items-center gap-0.5 text-[11px]" style={{ color: "#4ec994" }}>
            <CheckCircle2 className="h-3 w-3" />
            {successCount}
          </span>
        )}
        {errorCount > 0 && (
          <span className="flex items-center gap-0.5 text-[11px]" style={{ color: "#f48771" }}>
            <XCircle className="h-3 w-3" />
            {errorCount}
          </span>
        )}
        {duration != null && (
          <span className="ml-auto text-[11px]" style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.5 }}>
            {(duration / 1000).toFixed(1)}s
          </span>
        )}
      </button>

      {/* Expanded tool calls */}
      {expanded && (
        <div
          className="px-3 pb-2"
          style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.06))" }}
        >
          {toolCalls.map((call) => (
            <div key={call.id} className="mt-1.5">
              <button
                type="button"
                onClick={() => toggleCall(call.id)}
                className="flex w-full items-center gap-2 rounded px-1 py-0.5 text-left transition-colors hover:bg-white/5"
              >
                <StatusIcon status={call.status} />
                <span className="flex-1 text-[12px] font-medium" style={{ color: "var(--vscode-sidebar-foreground)" }}>
                  {call.tool}
                </span>
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-mono"
                  style={{
                    color: "var(--vscode-tab-inactive-foreground)",
                    opacity: 0.6,
                  }}
                >
                  {call.duration}ms
                </span>
              </button>

              {expandedCalls.has(call.id) && (
                <div className="ml-5 mt-1">
                  <pre
                    className="overflow-x-auto rounded-md px-2.5 py-2 text-[11px] leading-relaxed"
                    style={{
                      backgroundColor: "var(--vscode-editor-background)",
                      color: "var(--vscode-tab-inactive-foreground)",
                      fontFamily: "'SF Mono', Menlo, monospace",
                      border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.06))",
                    }}
                  >
                    {call.input}
                    {call.output && (
                      <>
                        {"\n"}
                        <span style={{ color: "#4ec994" }}>{"→ "}</span>
                        {call.output}
                      </>
                    )}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
