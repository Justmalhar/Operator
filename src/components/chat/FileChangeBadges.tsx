import { FileCode2 } from "lucide-react";

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
            className="flex items-center gap-1.5 rounded-md text-[11px] font-medium transition-colors duration-75 theme-hover-bg"
            style={{
              padding: "4px 9px",
              backgroundColor: "rgba(255, 255, 255, 0.04)",
              border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.06))",
              color: "var(--vscode-sidebar-foreground)",
            }}
            title={change.filename}
          >
            <FileCode2 className="h-[11px] w-[11px] shrink-0 opacity-50" />
            <span>{shortName}</span>
            {change.added > 0 && (
              <span className="font-mono text-[10px]" style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }}>+{change.added}</span>
            )}
            {change.removed > 0 && (
              <span className="font-mono text-[10px]" style={{ color: "var(--vscode-errorForeground, #f48771)" }}>-{change.removed}</span>
            )}
          </button>
        );
      })}

    </div>
  );
}
