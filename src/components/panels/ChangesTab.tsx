import { GitCommit, Plus, Minus } from "lucide-react";

interface FileChange {
  filename: string;
  added: number;
  removed: number;
  status: "added" | "modified" | "deleted";
}

const MOCK_CHANGES: FileChange[] = [
  { filename: "src/components/panels/RightPanel.tsx", added: 87, removed: 0, status: "added" },
  { filename: "src/components/panels/ChangesTab.tsx", added: 54, removed: 0, status: "added" },
  { filename: "src/components/panels/FileTree.tsx", added: 102, removed: 0, status: "added" },
  { filename: "src/App.tsx", added: 12, removed: 3, status: "modified" },
  { filename: "CLAUDE.md", added: 6, removed: 0, status: "modified" },
];

const statusColor = {
  added: "#4ec994",
  modified: "#e2c08d",
  deleted: "#f48771",
};

const statusLetter = {
  added: "A",
  modified: "M",
  deleted: "D",
};

export function ChangesTab() {
  const totalAdded = MOCK_CHANGES.reduce((s, c) => s + c.added, 0);
  const totalRemoved = MOCK_CHANGES.reduce((s, c) => s + c.removed, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Summary */}
      <div
        className="flex shrink-0 items-center gap-4 px-4 py-2.5 text-[12px]"
        style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border)" }}
      >
        <span className="flex items-center gap-1 font-medium" style={{ color: "#4ec994" }}>
          <Plus className="h-3 w-3" />
          {totalAdded}
        </span>
        <span className="flex items-center gap-1 font-medium" style={{ color: "#f48771" }}>
          <Minus className="h-3 w-3" />
          {totalRemoved}
        </span>
        <span
          className="ml-auto text-[11px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          {MOCK_CHANGES.length} files changed
        </span>
      </div>

      {/* File list */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {MOCK_CHANGES.map((change) => {
          const shortName = change.filename.split("/").pop() ?? change.filename;
          const dir = change.filename.includes("/")
            ? change.filename.slice(0, change.filename.lastIndexOf("/"))
            : "";

          return (
            <button
              key={change.filename}
              type="button"
              className="vscode-list-item flex w-full items-start gap-3 rounded-lg px-4 py-5 text-left transition-colors duration-75"
            >
              {/* Status badge */}
              <span
                className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold"
                style={{
                  color: statusColor[change.status],
                  backgroundColor: `${statusColor[change.status]}20`,
                }}
              >
                {statusLetter[change.status]}
              </span>

              {/* File info */}
              <span className="min-w-0 flex-1">
                <span
                  className="block truncate text-[13px] font-medium"
                  style={{
                    color: "var(--vscode-sidebar-foreground)",
                    fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace",
                  }}
                >
                  {shortName}
                </span>
                {dir && (
                  <span
                    className="mt-0.5 block truncate text-[11px]"
                    style={{
                      color: "var(--vscode-tab-inactive-foreground)",
                      fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace",
                    }}
                  >
                    {dir}
                  </span>
                )}
              </span>

              {/* Diff counts */}
              <span
                className="mt-[2px] flex shrink-0 items-center gap-1.5 text-[11px] font-medium"
                style={{ fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace" }}
              >
                {change.added > 0 && (
                  <span style={{ color: "#4ec994" }}>+{change.added}</span>
                )}
                {change.removed > 0 && (
                  <span style={{ color: "#f48771" }}>-{change.removed}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Commit button */}
      <div
        className="shrink-0 px-4 py-3"
        style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border)" }}
      >
        <button
          type="button"
          className="vscode-button flex w-full items-center justify-center gap-2 rounded py-2 text-[12px] font-medium"
        >
          <GitCommit className="h-3.5 w-3.5" />
          Commit changes
        </button>
      </div>
    </div>
  );
}
