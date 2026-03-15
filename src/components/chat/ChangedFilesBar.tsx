import { Clock, RotateCcw, ChevronUp } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface ChangedFile {
  filename: string;
  added: number;
  removed: number;
}

interface ChangedFilesBarProps {
  files: ChangedFile[];
  durationMs?: number;
  onFileClick: (file: ChangedFile) => void;
}

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function ChangedFilesBar({ files, durationMs, onFileClick }: ChangedFilesBarProps) {
  if (files.length === 0) return null;

  return (
    <div
      className="flex shrink-0 items-center gap-2 px-4 py-1.5"
      style={{
        borderTop: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))",
        backgroundColor: "var(--vscode-panel-background, var(--vscode-editor-background))",
      }}
    >
      {/* Left: session meta */}
      <div
        className="flex shrink-0 items-center gap-2 text-[11px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.5 }}
      >
        {durationMs != null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(durationMs)}
          </span>
        )}
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/6"
          title="Undo last change"
          style={{ color: "inherit" }}
        >
          <RotateCcw className="h-3 w-3" />
        </button>
        <button
          type="button"
          className="flex h-5 w-5 items-center justify-center rounded transition-colors hover:bg-white/6"
          title="Scroll to top"
          style={{ color: "inherit" }}
        >
          <ChevronUp className="h-3 w-3" />
        </button>
      </div>

      {/* Divider */}
      <span
        className="h-3 w-px shrink-0"
        style={{ backgroundColor: "var(--vscode-panel-border, rgba(255,255,255,0.1))" }}
      />

      {/* Right: scrollable file chips */}
      <ScrollArea className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 pb-0.5">
          {files.map((file) => {
            const shortName = file.filename.split("/").pop() ?? file.filename;
            return (
              <button
                key={file.filename}
                type="button"
                onClick={() => onFileClick(file)}
                className="flex shrink-0 items-center gap-1.5 rounded px-2 py-[3px] text-[11px] transition-colors hover:bg-white/6"
                style={{
                  backgroundColor: "var(--vscode-sidebar-section-header-background, rgba(255,255,255,0.03))",
                  border: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.07))",
                  color: "var(--vscode-sidebar-foreground)",
                }}
                title={file.filename}
              >
                <span className="font-medium">{shortName}</span>
                {file.added > 0 && (
                  <span className="font-mono tabular-nums" style={{ color: "#4ec994" }}>
                    +{file.added}
                  </span>
                )}
                {file.removed > 0 && (
                  <span className="font-mono tabular-nums" style={{ color: "#f48771" }}>
                    -{file.removed}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
