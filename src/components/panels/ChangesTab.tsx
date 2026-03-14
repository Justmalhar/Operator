import { FileDiff, GitCommit, Plus, Minus, Pencil } from "lucide-react";

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

const statusIcon = {
  added: <Plus className="h-3 w-3" style={{ color: "#4ec994" }} />,
  modified: <Pencil className="h-3 w-3" style={{ color: "#e2c08d" }} />,
  deleted: <Minus className="h-3 w-3" style={{ color: "#f48771" }} />,
};

const statusLabel = {
  added: "A",
  modified: "M",
  deleted: "D",
};

const statusColor = {
  added: "#4ec994",
  modified: "#e2c08d",
  deleted: "#f48771",
};

export function ChangesTab() {
  const totalAdded = MOCK_CHANGES.reduce((s, c) => s + c.added, 0);
  const totalRemoved = MOCK_CHANGES.reduce((s, c) => s + c.removed, 0);

  return (
    <div className="flex h-full flex-col">
      {/* Summary */}
      <div
        className="flex shrink-0 items-center gap-3 px-3 py-2 text-[12px]"
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
        <span className="ml-auto flex items-center gap-1" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
          <FileDiff className="h-3 w-3" />
          {MOCK_CHANGES.length} files
        </span>
      </div>

      {/* File list */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1">
        {MOCK_CHANGES.map((change) => {
          const shortName = change.filename.split("/").pop() ?? change.filename;
          const dir = change.filename.includes("/")
            ? change.filename.slice(0, change.filename.lastIndexOf("/"))
            : "";

          return (
            <button
              key={change.filename}
              type="button"
              className="vscode-list-item flex w-full items-center gap-2 px-3 py-[4px] text-left text-[13px] transition-colors duration-75"
            >
              {statusIcon[change.status]}
              <span className="min-w-0 flex-1 truncate" style={{ color: "var(--vscode-sidebar-foreground)" }}>
                {shortName}
                {dir && (
                  <span className="ml-1 text-[11px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
                    {dir}
                  </span>
                )}
              </span>
              <span
                className="shrink-0 text-[11px] font-semibold"
                style={{ color: statusColor[change.status] }}
              >
                {statusLabel[change.status]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Commit button */}
      <div
        className="shrink-0 px-3 py-2"
        style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border)" }}
      >
        <button
          type="button"
          className="vscode-button flex w-full items-center justify-center gap-1.5 rounded py-1.5 text-[12px] font-medium"
        >
          <GitCommit className="h-3.5 w-3.5" />
          Commit changes
        </button>
      </div>
    </div>
  );
}
