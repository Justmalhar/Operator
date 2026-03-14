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

function getFileColor(name: string): string {
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "#519aba";
  if (name.endsWith(".css")) return "#563d7c";
  if (name.endsWith(".json")) return "#cbcb41";
  if (name.endsWith(".md")) return "#519aba";
  if (name.endsWith(".svg")) return "#f1502f";
  return "var(--vscode-list-tree-indent-guide-stroke)";
}

interface TreeNodeProps {
  node: FileNode;
  depth?: number;
  selectedFile: string | null;
  onSelectFile: (name: string) => void;
  onOpenFile?: (filename: string, filePath: string) => void;
}

function TreeNode({
  node,
  depth = 0,
  selectedFile,
  onSelectFile,
  onOpenFile,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const indent = 16 + depth * 16;

  if (node.type === "dir") {
    return (
      <div>
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="vscode-list-item flex h-[22px] w-full items-center gap-1.5 text-left text-[13px] transition-colors duration-75"
          style={{ paddingLeft: `${indent}px` }}
        >
          <ChevronRight
            className={cn(
              "h-3 w-3 shrink-0 transition-transform duration-100",
              expanded && "rotate-90",
            )}
            style={{ color: "var(--vscode-list-tree-indent-guide-stroke)", opacity: 0.6 }}
          />
          {expanded ? (
            <FolderOpen className="h-[14px] w-[14px] shrink-0" style={{ color: "#e8ab53" }} />
          ) : (
            <Folder className="h-[14px] w-[14px] shrink-0" style={{ color: "#e8ab53" }} />
          )}
          <span className="truncate font-medium" style={{ color: "var(--vscode-sidebar-foreground)" }}>
            {node.name}
          </span>
        </button>
        {expanded && (
          <div className="relative">
            {/* Indent guide */}
            <span
              className="tree-indent-guide"
              style={{ left: `${indent + 7}px` }}
            />
            {node.children?.map((child) => (
              <TreeNode
                key={child.name}
                node={child}
                depth={depth + 1}
                selectedFile={selectedFile}
                onSelectFile={onSelectFile}
                onOpenFile={onOpenFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isSelected = selectedFile === node.name;

  return (
    <button
      type="button"
      onClick={() => {
        onSelectFile(node.name);
        onOpenFile?.(node.name, `src/${node.name}`);
      }}
      className={cn(
        "vscode-list-item flex h-[22px] w-full items-center gap-1.5 text-left text-[13px] transition-colors duration-75",
        isSelected && "selected",
      )}
      style={{ paddingLeft: `${indent + 16}px` }}
    >
      <File
        className="h-[14px] w-[14px] shrink-0"
        style={{ color: getFileColor(node.name) }}
      />
      <span
        className="min-w-0 flex-1 truncate"
        style={{
          color: node.modified
            ? "#e2c08d"
            : node.added != null
              ? "#4ec994"
              : "var(--vscode-sidebar-foreground)",
        }}
      >
        {node.name}
      </span>
      {node.added != null && (
        <span className="mr-1 shrink-0 text-[10px] font-mono font-medium" style={{ color: "#4ec994" }}>
          +{node.added}
        </span>
      )}
      {node.modified && (
        <span className="mr-1 shrink-0 text-[10px] font-mono font-medium" style={{ color: "#e2c08d" }}>
          M
        </span>
      )}
    </button>
  );
}

interface FileTreeProps {
  onOpenFile?: (filename: string, filePath: string) => void;
}

export function FileTree({ onOpenFile }: FileTreeProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  return (
    <div className="vscode-scrollable h-full overflow-y-auto py-0.5">
      {MOCK_TREE.map((node) => (
        <TreeNode
          key={node.name}
          node={node}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          onOpenFile={onOpenFile}
        />
      ))}
    </div>
  );
}
