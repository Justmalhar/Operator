import { useState } from "react";
import { ChevronRight, CheckCircle2, XCircle, Clock } from "lucide-react";
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

const statusIcon = {
  success: <CheckCircle2 className="h-3 w-3" style={{ color: "#4ec994" }} />,
  error: <XCircle className="h-3 w-3" style={{ color: "#f48771" }} />,
  running: <Clock className="h-3 w-3 animate-pulse" style={{ color: "#3b9edd" }} />,
};

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

  return (
    <div
      className="my-1.5 rounded"
      style={{ backgroundColor: "var(--vscode-list-inactive-selection-background)" }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left"
      >
        <ChevronRight
          className={cn("h-3 w-3 shrink-0 transition-transform duration-150", expanded && "rotate-90")}
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        />
        <span className="text-[12px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
          {toolCalls.length} tool call{toolCalls.length !== 1 ? "s" : ""}
          {duration != null && ` · ${(duration / 1000).toFixed(1)}s`}
        </span>
      </button>

      {/* Expanded tool calls */}
      {expanded && (
        <div
          className="border-t px-2.5 pb-2 pt-1"
          style={{ borderColor: "var(--vscode-sidebar-section-header-border)" }}
        >
          {toolCalls.map((call) => (
            <div key={call.id} className="mt-1">
              <button
                type="button"
                onClick={() => toggleCall(call.id)}
                className="flex w-full items-center gap-2 text-left"
              >
                {statusIcon[call.status]}
                <span className="flex-1 text-[12px] font-medium" style={{ color: "var(--vscode-sidebar-foreground)" }}>
                  {call.tool}
                </span>
                <span className="text-[11px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
                  {call.duration}ms
                </span>
              </button>

              {expandedCalls.has(call.id) && (
                <div className="ml-5 mt-1">
                  <pre
                    className="overflow-x-auto rounded px-2 py-1.5 text-[11px] leading-relaxed"
                    style={{
                      backgroundColor: "var(--vscode-editor-background)",
                      color: "var(--vscode-tab-inactive-foreground)",
                      fontFamily: "monospace",
                    }}
                  >
                    {call.input}
                    {call.output && (
                      <>
                        {"\n\n→ "}
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
