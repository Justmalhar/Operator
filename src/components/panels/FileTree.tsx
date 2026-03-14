import { useState } from "react";
import { ChevronRight, File, Folder, FolderOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileNode {
  name: string;
  type: "file" | "dir";
  children?: FileNode[];
  added?: number;
  modified?: boolean;
}

const MOCK_TREE: FileNode[] = [
  {
    name: "src",
    type: "dir",
    children: [
      {
        name: "components",
        type: "dir",
        children: [
          { name: "ChatPanel.tsx", type: "file", added: 3 },
          { name: "Composer.tsx", type: "file", modified: true },
          { name: "RightPanel.tsx", type: "file", added: 1 },
        ],
      },
      { name: "App.tsx", type: "file", modified: true },
      { name: "main.tsx", type: "file" },
    ],
  },
  {
    name: "assets",
    type: "dir",
    children: [{ name: "react.svg", type: "file" }],
  },
  { name: "CLAUDE.md", type: "file", added: 12 },
  { name: "operator.json", type: "file" },
];

function TreeNode({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (node.type === "dir") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="vscode-list-item flex w-full items-center gap-1 text-left text-[13px] transition-colors duration-75"
          style={{ paddingLeft: `${8 + depth * 12}px`, paddingTop: 2, paddingBottom: 2 }}
        >
          <ChevronRight
            className={cn("h-3 w-3 shrink-0 transition-transform duration-150", expanded && "rotate-90")}
            style={{ color: "var(--vscode-list-tree-indent-guide-stroke)" }}
          />
          {expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0" style={{ color: "#e8ab53" }} />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: "#e8ab53" }} />
          )}
          <span className="truncate" style={{ color: "var(--vscode-sidebar-foreground)" }}>
            {node.name}
          </span>
        </button>
        {expanded && node.children?.map((child) => (
          <TreeNode key={child.name} node={child} depth={depth + 1} />
        ))}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="vscode-list-item flex w-full items-center gap-1.5 text-left text-[13px] transition-colors duration-75"
      style={{ paddingLeft: `${20 + depth * 12}px`, paddingTop: 2, paddingBottom: 2 }}
    >
      <File className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--vscode-list-tree-indent-guide-stroke)" }} />
      <span className="min-w-0 flex-1 truncate" style={{ color: "var(--vscode-sidebar-foreground)" }}>
        {node.name}
      </span>
      {node.added != null && (
        <span className="shrink-0 text-[11px] font-medium" style={{ color: "#4ec994" }}>
          +{node.added}
        </span>
      )}
      {node.modified && (
        <span className="shrink-0 text-[11px] font-medium" style={{ color: "#e2c08d" }}>
          M
        </span>
      )}
    </button>
  );
}

export function FileTree() {
  return (
    <div className="vscode-scrollable h-full overflow-y-auto py-1">
      {MOCK_TREE.map((node) => (
        <TreeNode key={node.name} node={node} />
      ))}
    </div>
  );
}
