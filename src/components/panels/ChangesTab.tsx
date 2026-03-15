import { useCallback, useEffect, useState } from "react";
import { ChevronDown, CloudDownload, CloudUpload, GitCommit, GitMerge, GitPullRequest, Loader2, Plus, Minus, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { staggerContainer, staggerItem, springs } from "@/lib/animations";
import * as api from "@/lib/tauri";
import type { DiffFileStat } from "@/types/git";
import { cn } from "@/lib/utils";

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
  const [committing, setCommitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [pushing, setPushing] = useState(false);

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

  const handleFetch = useCallback(async () => {
    if (!worktreePath) return;
    setFetching(true);
    try {
      await api.gitFetch(worktreePath);
    } catch (err) {
      console.error("Failed to fetch:", err);
    }
    setFetching(false);
  }, [worktreePath]);

  const handlePull = useCallback(async () => {
    if (!worktreePath) return;
    setPulling(true);
    try {
      await api.gitPull(worktreePath);
      await fetchChanges();
    } catch (err) {
      console.error("Failed to pull:", err);
    }
    setPulling(false);
  }, [worktreePath, fetchChanges]);

  const handleCommit = useCallback(async () => {
    if (!worktreePath || files.length === 0) return;
    setCommitting(true);
    try {
      const paths = files.map((f) => f.path);
      await api.gitStage(worktreePath, paths);
      const msg = files.length === 1
        ? `Update ${files[0].path.split("/").pop()}`
        : `Update ${files.length} files`;
      await api.gitCommit(worktreePath, msg);
      await fetchChanges();
    } catch (err) {
      console.error("Failed to commit:", err);
    }
    setCommitting(false);
  }, [worktreePath, files, fetchChanges]);

  const handlePush = useCallback(async () => {
    if (!worktreePath) return;
    setPushing(true);
    try {
      await api.gitPush(worktreePath);
    } catch (err) {
      console.error("Failed to push:", err);
    }
    setPushing(false);
  }, [worktreePath]);

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
        <span className="flex items-center gap-1 font-medium" style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }}>
          <Plus className="h-3 w-3" />
          {totalInsertions}
        </span>
        <span className="flex items-center gap-1 font-medium" style={{ color: "var(--vscode-errorForeground, #f48771)" }}>
          <Minus className="h-3 w-3" />
          {totalDeletions}
        </span>
        <span
          className="ml-auto text-[11px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          {files.length} files changed
        </span>
        <div className="flex items-center gap-1">
          <motion.button
            type="button"
            onClick={handleFetch}
            disabled={fetching}
            whileHover={!fetching ? { scale: 1.1 } : {}}
            whileTap={!fetching ? { scale: 0.9 } : {}}
            transition={springs.snappy}
            className={cn("flex h-5 items-center gap-1 rounded px-1.5 theme-hover-bg text-[10px] font-medium transition-opacity", fetching && "opacity-40 cursor-not-allowed")}
            title="Git fetch"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          >
            {fetching ? <Loader2 className="h-3 w-3 animate-spin" /> : <CloudDownload className="h-3 w-3" />}
            Fetch
          </motion.button>

          <motion.button
            type="button"
            onClick={handlePull}
            disabled={pulling}
            whileHover={!pulling ? { scale: 1.1 } : {}}
            whileTap={!pulling ? { scale: 0.9 } : {}}
            transition={springs.snappy}
            className={cn("flex h-5 items-center gap-1 rounded px-1.5 theme-hover-bg text-[10px] font-medium transition-opacity", pulling && "opacity-40 cursor-not-allowed")}
            title="Git pull"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          >
            {pulling ? <Loader2 className="h-3 w-3 animate-spin" /> : <GitMerge className="h-3 w-3" />}
            Pull
          </motion.button>

          <motion.button
            type="button"
            onClick={fetchChanges}
            whileHover={{ scale: 1.2, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={springs.snappy}
            className="flex h-5 w-5 items-center justify-center rounded theme-hover-bg"
            aria-label="Refresh"
            title="Refresh changes"
          >
            <RefreshCw className="h-3 w-3" style={{ color: "var(--vscode-tab-inactive-foreground)" }} />
          </motion.button>
        </div>
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
                    <span style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }}>+{change.insertions}</span>
                  )}
                  {change.deletions > 0 && (
                    <span style={{ color: "var(--vscode-errorForeground, #f48771)" }}>-{change.deletions}</span>
                  )}
                </span>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Action buttons grid */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.1 }}
        className="shrink-0 px-3 py-3 flex flex-col gap-2"
        style={{ borderTop: "1px solid var(--vscode-panel-border, rgba(128,128,128,0.2))" }}
      >
        {/* Row 1: Fetch + Pull */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Fetch", icon: CloudDownload, loading: fetching, onClick: handleFetch, title: "git fetch" },
            { label: "Pull", icon: GitMerge, loading: pulling, onClick: handlePull, title: "git pull" },
          ].map(({ label, icon: Icon, loading, onClick, title }) => (
            <motion.button
              key={label}
              type="button"
              onClick={onClick}
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.97 } : {}}
              transition={springs.snappy}
              title={title}
              className="flex items-center justify-center gap-1.5 rounded-md py-[7px] text-[12px] font-medium transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40 theme-hover-bg"
              style={{
                border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.1))",
                color: "var(--vscode-tab-inactive-foreground)",
              }}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
              {label}
            </motion.button>
          ))}
        </div>

        {/* Row 2: Commit + Push */}
        <div className="grid grid-cols-2 gap-2">
          <motion.button
            type="button"
            onClick={handleCommit}
            disabled={committing || files.length === 0}
            whileHover={!committing && files.length > 0 ? { scale: 1.02 } : {}}
            whileTap={!committing && files.length > 0 ? { scale: 0.97 } : {}}
            transition={springs.snappy}
            title="Stage all and commit"
            className="vscode-button flex items-center justify-center gap-1.5 rounded-md py-[7px] text-[12px] font-semibold tracking-wide transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {committing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <GitCommit className="h-3.5 w-3.5" />}
            Commit
          </motion.button>

          <motion.button
            type="button"
            onClick={handlePush}
            disabled={pushing}
            whileHover={!pushing ? { scale: 1.02 } : {}}
            whileTap={!pushing ? { scale: 0.97 } : {}}
            transition={springs.snappy}
            title="git push"
            className="flex items-center justify-center gap-1.5 rounded-md py-[7px] text-[12px] font-semibold tracking-wide transition-opacity duration-150 disabled:cursor-not-allowed disabled:opacity-40 theme-hover-bg"
            style={{
              border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.1))",
              color: "var(--vscode-tab-inactive-foreground)",
            }}
          >
            {pushing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CloudUpload className="h-3.5 w-3.5" />}
            Push
          </motion.button>
        </div>

        {/* Row 3: Create PR (full width split button) */}
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          transition={springs.snappy}
          className="flex items-stretch overflow-hidden rounded-md"
          style={{ border: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.12))" }}
        >
          <button
            type="button"
            className="flex flex-1 items-center justify-center gap-1.5 px-3 py-[7px] text-[12px] font-semibold tracking-wide transition-colors duration-75 theme-hover-bg"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          >
            <GitPullRequest className="h-3.5 w-3.5 shrink-0" />
            Create PR
          </button>
          <div style={{ width: "1px", backgroundColor: "var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.08))" }} />
          <button
            type="button"
            className="flex items-center px-2.5 py-[7px] transition-colors duration-75 theme-hover-bg"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
            title="PR options"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
