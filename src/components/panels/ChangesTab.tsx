import { useCallback, useEffect, useState } from "react";
import { GitCommit, Loader2, Plus, Minus, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, springs } from "@/lib/animations";
import * as api from "@/lib/tauri";
import type { DiffFileStat } from "@/types/git";

interface ChangesTabProps {
  worktreePath?: string;
}

const statusColor: Record<string, string> = {
  added: "#4ec994",
  modified: "#e2c08d",
  deleted: "#f48771",
  untracked: "#4ec994",
  renamed: "#3b9edd",
  copied: "#3b9edd",
};

const statusLetter: Record<string, string> = {
  added: "A",
  modified: "M",
  deleted: "D",
  untracked: "U",
  renamed: "R",
  copied: "C",
};

export function ChangesTab({ worktreePath }: ChangesTabProps) {
  const [files, setFiles] = useState<DiffFileStat[]>([]);
  const [totalInsertions, setTotalInsertions] = useState(0);
  const [totalDeletions, setTotalDeletions] = useState(0);
  const [loading, setLoading] = useState(false);
  const [commitMsg, setCommitMsg] = useState("");
  const [committing, setCommitting] = useState(false);

  const fetchChanges = useCallback(async () => {
    if (!worktreePath) return;
    setLoading(true);
    try {
      const diff = await api.getGitDiff(worktreePath, false);
      setFiles(diff.files);
      setTotalInsertions(diff.total_insertions);
      setTotalDeletions(diff.total_deletions);
    } catch (err) {
      console.error("Failed to fetch git diff:", err);
    }
    setLoading(false);
  }, [worktreePath]);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  const handleCommit = useCallback(async () => {
    if (!worktreePath || !commitMsg.trim()) return;
    setCommitting(true);
    try {
      const paths = files.map((f) => f.path);
      if (paths.length > 0) {
        await api.gitStage(worktreePath, paths);
      }
      await api.gitCommit(worktreePath, commitMsg.trim());
      setCommitMsg("");
      await fetchChanges();
    } catch (err) {
      console.error("Failed to commit:", err);
    }
    setCommitting(false);
  }, [worktreePath, commitMsg, files, fetchChanges]);

  if (!worktreePath) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full items-center justify-center px-4 text-[12px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        Select a workspace to see changes
      </motion.div>
    );
  }

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full items-center justify-center px-4 text-[12px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading changes...
      </motion.div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Summary */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.smooth}
        className="flex shrink-0 items-center gap-4 px-4 py-2.5 text-[12px]"
        style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border)" }}
      >
        <span className="flex items-center gap-1 font-medium" style={{ color: "#4ec994" }}>
          <Plus className="h-3 w-3" />
          {totalInsertions}
        </span>
        <span className="flex items-center gap-1 font-medium" style={{ color: "#f48771" }}>
          <Minus className="h-3 w-3" />
          {totalDeletions}
        </span>
        <span
          className="ml-auto text-[11px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          {files.length} files changed
        </span>
        <motion.button
          type="button"
          onClick={fetchChanges}
          whileHover={{ scale: 1.2, rotate: 180 }}
          whileTap={{ scale: 0.9 }}
          transition={springs.snappy}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-white/8"
          aria-label="Refresh"
          title="Refresh changes"
        >
          <RefreshCw className="h-3 w-3" style={{ color: "var(--vscode-tab-inactive-foreground)" }} />
        </motion.button>
      </motion.div>

      {/* File list */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        <AnimatePresence>
          {files.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-8 text-center text-[12px]"
              style={{ color: "var(--vscode-tab-inactive-foreground)" }}
            >
              No changes detected
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-2"
        >
          {files.map((change) => {
            const shortName = change.path.split("/").pop() ?? change.path;
            const dir = change.path.includes("/")
              ? change.path.slice(0, change.path.lastIndexOf("/"))
              : "";
            const color = statusColor[change.status] ?? "#e2c08d";
            const letter = statusLetter[change.status] ?? "?";

            return (
              <motion.button
                key={change.path}
                variants={staggerItem}
                type="button"
                whileHover={{ x: 2, backgroundColor: "var(--vscode-list-hover-background)" }}
                whileTap={{ scale: 0.98 }}
                className="vscode-list-item flex w-full items-start gap-3 rounded-lg px-4 py-5 text-left"
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={springs.bouncy}
                  className="mt-[1px] flex h-5 w-5 shrink-0 items-center justify-center rounded text-[11px] font-bold"
                  style={{ color, backgroundColor: `${color}20` }}
                >
                  {letter}
                </motion.span>

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

                <span
                  className="mt-[2px] flex shrink-0 items-center gap-1.5 text-[11px] font-medium"
                  style={{ fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace" }}
                >
                  {change.insertions > 0 && (
                    <span style={{ color: "#4ec994" }}>+{change.insertions}</span>
                  )}
                  {change.deletions > 0 && (
                    <span style={{ color: "#f48771" }}>-{change.deletions}</span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Commit area */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.1 }}
        className="shrink-0 space-y-2 px-4 py-3"
        style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border)" }}
      >
        <input
          type="text"
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Commit message..."
          className="vscode-input w-full rounded px-3 py-1.5 text-[12px]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleCommit();
            }
          }}
        />
        <motion.button
          type="button"
          onClick={handleCommit}
          disabled={committing || files.length === 0 || !commitMsg.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={springs.snappy}
          className="vscode-button flex w-full items-center justify-center gap-2 rounded py-2 text-[12px] font-medium disabled:opacity-50"
        >
          {committing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <GitCommit className="h-3.5 w-3.5" />
          )}
          Commit changes
        </motion.button>
      </motion.div>
    </div>
  );
}
