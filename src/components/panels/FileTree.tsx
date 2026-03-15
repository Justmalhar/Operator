import { memo, useCallback, useEffect, useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { FileIcon } from "@/components/shared/FileIcon";
import { springs } from "@/lib/animations";
import * as api from "@/lib/tauri";
import type { FileEntry } from "@/types/file";

interface TreeNodeData {
  entry: FileEntry;
  children?: TreeNodeData[];
  loaded: boolean;
}

function buildNodes(entries: FileEntry[]): TreeNodeData[] {
  return entries.map((entry) => ({
    entry,
    children: entry.is_dir ? undefined : undefined,
    loaded: !entry.is_dir,
  }));
}

interface TreeNodeProps {
  node: TreeNodeData;
  depth: number;
  selectedFile: string | null;
  onSelectFile: (path: string) => void;
  onOpenFile?: (filename: string, filePath: string) => void;
  onLoadChildren: (path: string) => Promise<TreeNodeData[]>;
}

const TreeNode = memo(function TreeNode({
  node,
  depth,
  selectedFile,
  onSelectFile,
  onOpenFile,
  onLoadChildren,
}: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [children, setChildren] = useState<TreeNodeData[] | undefined>(node.children);
  const [loading, setLoading] = useState(false);
  const indent = 16 + depth * 16;

  const handleToggle = useCallback(async () => {
    if (!expanded && !children) {
      setLoading(true);
      try {
        const loaded = await onLoadChildren(node.entry.path);
        setChildren(loaded);
      } catch {
        setChildren([]);
      }
      setLoading(false);
    }
    setExpanded((e) => !e);
  }, [expanded, children, node.entry.path, onLoadChildren]);

  if (node.entry.is_dir) {
    return (
      <div>
        <button
          type="button"
          onClick={handleToggle}
          className="vscode-list-item flex h-[32px] w-full items-center gap-2 text-left text-[13px] transition-colors duration-75"
          style={{ paddingLeft: `${indent}px` }}
        >
          {loading ? (
            <Loader2
              className="h-3 w-3 shrink-0 animate-spin"
              style={{ color: "var(--vscode-list-tree-indent-guide-stroke)", opacity: 0.6 }}
            />
          ) : (
            <motion.span
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={springs.snappy}
              className="flex shrink-0"
            >
              <ChevronRight
                className="h-3 w-3"
                style={{ color: "var(--vscode-list-tree-indent-guide-stroke)", opacity: 0.6 }}
              />
            </motion.span>
          )}
          <FileIcon filename={node.entry.name} isDir isOpen={expanded} size={16} />
          <span
            className="truncate font-medium"
            style={{
              color: "var(--vscode-sidebar-foreground)",
              fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace",
              fontSize: "13px",
            }}
          >
            {node.entry.name}
          </span>
        </button>
        <AnimatePresence>
          {expanded && children && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="relative overflow-hidden"
            >
              <span
                className="tree-indent-guide"
                style={{ left: `${indent + 7}px` }}
              />
              {children.map((child, i) => (
                <motion.div
                  key={child.entry.path}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02, duration: 0.12 }}
                >
                  <TreeNode
                    node={child}
                    depth={depth + 1}
                    selectedFile={selectedFile}
                    onSelectFile={onSelectFile}
                    onOpenFile={onOpenFile}
                    onLoadChildren={onLoadChildren}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  const isSelected = selectedFile === node.entry.path;

  return (
    <motion.button
      type="button"
      onClick={() => {
        onSelectFile(node.entry.path);
        onOpenFile?.(node.entry.name, node.entry.path);
      }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.98 }}
      transition={springs.snappy}
      className={cn(
        "vscode-list-item flex h-[32px] w-full items-center gap-2 text-left text-[13px]",
        isSelected && "selected",
      )}
      style={{ paddingLeft: `${indent + 16}px` }}
    >
      <FileIcon filename={node.entry.name} size={15} />
      <span
        className="min-w-0 flex-1 truncate"
        style={{
          color: "var(--vscode-sidebar-foreground)",
          fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace",
          fontSize: "13px",
        }}
      >
        {node.entry.name}
      </span>
    </motion.button>
  );
});

interface FileTreeProps {
  worktreePath?: string;
  onOpenFile?: (filename: string, filePath: string) => void;
}

export function FileTree({ worktreePath, onOpenFile }: FileTreeProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [rootNodes, setRootNodes] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!worktreePath) {
      setRootNodes([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api.listDirectory(worktreePath).then((entries) => {
      if (!cancelled) {
        setRootNodes(buildNodes(entries));
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [worktreePath]);

  const handleLoadChildren = useCallback(async (dirPath: string): Promise<TreeNodeData[]> => {
    const entries = await api.listDirectory(dirPath);
    return buildNodes(entries);
  }, []);

  if (!worktreePath) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full items-center justify-center px-4 text-[12px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        Select a workspace to browse files
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full flex-col items-center justify-center gap-2 px-4 text-[12px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading files...
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="vscode-scrollable h-full overflow-y-auto py-0.5"
    >
      {rootNodes.map((node) => (
        <TreeNode
          key={node.entry.path}
          node={node}
          depth={0}
          selectedFile={selectedFile}
          onSelectFile={setSelectedFile}
          onOpenFile={onOpenFile}
          onLoadChildren={handleLoadChildren}
        />
      ))}
    </motion.div>
  );
}
