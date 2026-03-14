import { FileCode2, GitCompareArrows } from "lucide-react";

interface FileChange {
  filename: string;
  added: number;
  removed: number;
}

interface FileChangeBadgesProps {
  changes: FileChange[];
}

export function FileChangeBadges({ changes }: FileChangeBadgesProps) {
  if (changes.length === 0) return null;

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
      {changes.map((change) => {
        const shortName = change.filename.split("/").pop() ?? change.filename;
        return (
          <button
            key={change.filename}
            type="button"
            className="flex items-center gap-1.5 rounded-md px-2 py-[3px] text-[11px] font-medium transition-colors duration-75 hover:bg-white/5"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.06))",
              color: "var(--vscode-sidebar-foreground)",
            }}
            title={change.filename}
          >
            <FileCode2 className="h-3 w-3 shrink-0 opacity-50" />
            <span>{shortName}</span>
            {change.added > 0 && (
              <span className="font-mono text-[10px]" style={{ color: "#4ec994" }}>+{change.added}</span>
            )}
            {change.removed > 0 && (
              <span className="font-mono text-[10px]" style={{ color: "#f48771" }}>-{change.removed}</span>
            )}
          </button>
        );
      })}

      <button
        type="button"
        className="flex items-center gap-1 rounded-md px-2 py-[3px] text-[11px] font-medium transition-colors duration-75 hover:bg-white/5"
        style={{
          color: "var(--vscode-focus-border, #007fd4)",
          opacity: 0.8,
        }}
        title="View diff"
      >
        <GitCompareArrows className="h-3 w-3" />
        View Diff
      </button>
    </div>
  );
}
