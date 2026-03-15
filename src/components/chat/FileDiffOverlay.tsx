import { X, ArrowLeftRight } from "lucide-react";
import { DiffViewer } from "@/components/viewers/DiffViewer";
import type { ChangedFile } from "./ChangedFilesBar";

// ── Mock diff content factory ──────────────────────────────────────────────────
// In production this would come from `git diff` via a Tauri command.
// For now we use placeholder content so the DiffViewer renders meaningfully.

const PLACEHOLDER_ORIGINAL = `// Previous version of this file
// (original content would be fetched via git diff)
`;

const PLACEHOLDER_MODIFIED = `// Modified version of this file
// (modified content would be fetched from the working tree)
`;

interface FileDiffOverlayProps {
  file: ChangedFile;
  onClose: () => void;
}

export function FileDiffOverlay({ file, onClose }: FileDiffOverlayProps) {
  const shortName = file.filename.split("/").pop() ?? file.filename;

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      {/* Overlay header */}
      <div
        className="flex shrink-0 items-center gap-2 px-4 py-2"
        style={{
          borderBottom: "1px solid var(--vscode-panel-border, rgba(255,255,255,0.08))",
          backgroundColor: "var(--vscode-tab-bar-background, #252526)",
        }}
      >
        <ArrowLeftRight
          className="h-3.5 w-3.5 shrink-0"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
        />
        <span
          className="text-[12px] font-medium"
          style={{ color: "var(--vscode-sidebar-foreground)" }}
        >
          {shortName}
        </span>
        <span
          className="text-[11px] font-mono"
          style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.5 }}
        >
          {file.filename}
        </span>
        <div className="flex items-center gap-1.5 ml-2">
          {file.added > 0 && (
            <span className="text-[11px] font-mono tabular-nums" style={{ color: "#4ec994" }}>
              +{file.added}
            </span>
          )}
          {file.removed > 0 && (
            <span className="text-[11px] font-mono tabular-nums" style={{ color: "#f48771" }}>
              -{file.removed}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-white/8"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          title="Close diff (Esc)"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* DiffViewer */}
      <div className="min-h-0 flex-1">
        <DiffViewer
          filePath={file.filename}
          originalContent={PLACEHOLDER_ORIGINAL}
          modifiedContent={PLACEHOLDER_MODIFIED}
        />
      </div>
    </div>
  );
}
