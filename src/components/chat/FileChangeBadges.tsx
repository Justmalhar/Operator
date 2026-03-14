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
    <div className="mt-2 flex flex-wrap gap-1.5">
      {changes.map((change) => {
        const shortName = change.filename.split("/").pop() ?? change.filename;
        return (
          <button
            key={change.filename}
            type="button"
            className="flex items-center gap-1 rounded px-2 py-[3px] text-[11px] font-medium transition-colors duration-75"
            style={{
              backgroundColor: "var(--vscode-list-inactive-selection-background)",
              color: "var(--vscode-sidebar-foreground)",
            }}
            title={change.filename}
          >
            <span>{shortName}</span>
            {change.added > 0 && (
              <span style={{ color: "#4ec994" }}>+{change.added}</span>
            )}
            {change.removed > 0 && (
              <span style={{ color: "#f48771" }}>-{change.removed}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
