import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageList } from "./MessageList";
import { Composer } from "@/components/composer/Composer";
import { ChangedFilesBar, type ChangedFile } from "./ChangedFilesBar";
import { FileDiffOverlay } from "./FileDiffOverlay";
import { ChatTerminalPanel } from "./ChatTerminalPanel";
import { useWorkspaceStore } from "@/store/workspaceStore";
import { fadeInDown, fadeInScale, springs } from "@/lib/animations";
import * as api from "@/lib/tauri";

interface ChatPanelProps {
  workspaceId?: string;
}

export function ChatPanel({ workspaceId }: ChatPanelProps) {
  const [diffFile, setDiffFile] = useState<ChangedFile | null>(null);
  const [sessionChanges, setSessionChanges] = useState<ChangedFile[]>([]);
  const [sessionStart] = useState(() => Date.now());
  const [terminalOpen, setTerminalOpen] = useState(false);

  const getActiveWorkspace = useWorkspaceStore((s) => s.getActiveWorkspace);
  const activeWs = getActiveWorkspace();

  // Fetch real git diff for the workspace
  const fetchSessionChanges = useCallback(async () => {
    if (!activeWs?.worktree_path) {
      setSessionChanges([]);
      return;
    }
    try {
      const diff = await api.getGitDiff(activeWs.worktree_path, false);
      setSessionChanges(
        diff.files.map((f) => ({
          filename: f.path,
          added: f.insertions,
          removed: f.deletions,
        })),
      );
    } catch {
      setSessionChanges([]);
    }
  }, [activeWs?.worktree_path]);

  useEffect(() => {
    fetchSessionChanges();
    const interval = setInterval(fetchSessionChanges, 10_000);
    return () => clearInterval(interval);
  }, [fetchSessionChanges]);

  // Close diff overlay on Escape; toggle terminal with ⌘`
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && diffFile) setDiffFile(null);
      if ((e.metaKey || e.ctrlKey) && e.key === "`") {
        e.preventDefault();
        setTerminalOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [diffFile]);

  const durationMs = Date.now() - sessionStart;

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      {/* Changed files bar at the very top (above messages) */}
      <AnimatePresence>
        {sessionChanges.length > 0 && (
          <motion.div {...fadeInDown} key="changed-files-bar">
            <ChangedFilesBar
              files={sessionChanges}
              durationMs={durationMs}
              onFileClick={setDiffFile}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message list */}
      <div className="min-h-0 flex-1">
        <MessageList workspaceId={workspaceId} />
      </div>

      {/* Composer at bottom */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.smooth, delay: 0.15 }}
      >
        <Composer
          isTerminalOpen={terminalOpen}
          onToggleTerminal={() => setTerminalOpen((v) => !v)}
          className="mx-auto max-w-[720px]"
        />
      </motion.div>

      {/* Terminal panel below composer */}
      <AnimatePresence>
        {terminalOpen && (
          <motion.div
            key="chat-terminal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={springs.smooth}
            style={{ overflow: "hidden" }}
          >
            <ChatTerminalPanel worktreePath={activeWs?.worktree_path} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Diff overlay — floats above everything */}
      <AnimatePresence>
        {diffFile && (
          <motion.div {...fadeInScale} key="diff-overlay">
            <FileDiffOverlay file={diffFile} onClose={() => setDiffFile(null)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
