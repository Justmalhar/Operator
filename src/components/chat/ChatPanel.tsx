import { useEffect, useState } from "react";
import { MessageList } from "./MessageList";
import { Composer } from "@/components/composer/Composer";
import { ChangedFilesBar, type ChangedFile } from "./ChangedFilesBar";
import { FileDiffOverlay } from "./FileDiffOverlay";

// Mock session-level changed files.
// In production these come from `git status --short` via a Tauri command.
const MOCK_SESSION_CHANGES: ChangedFile[] = [
  { filename: "src/components/chat/MessageList.tsx", added: 18, removed: 19 },
  { filename: "src/components/chat/ToolCallMessage.tsx", added: 114, removed: 72 },
  { filename: "src/components/chat/UserMessage.tsx", added: 10, removed: 5 },
  { filename: "src/components/composer/Composer.tsx", added: 19, removed: 3 },
];

const SESSION_DURATION_MS = 3 * 60 * 1000 + 44 * 1000; // 3m 44s

interface ChatPanelProps {
  workspaceId?: string;
}

export function ChatPanel({ workspaceId }: ChatPanelProps) {
  const [diffFile, setDiffFile] = useState<ChangedFile | null>(null);

  // Close diff overlay on Escape
  useEffect(() => {
    if (!diffFile) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setDiffFile(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [diffFile]);

  return (
    <div
      className="relative flex h-full flex-col"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      {/* Chat area (hidden behind overlay when diff is open) */}
      <div className="min-h-0 flex-1">
        <MessageList workspaceId={workspaceId} />
      </div>
      <Composer />
      <ChangedFilesBar
        files={MOCK_SESSION_CHANGES}
        durationMs={SESSION_DURATION_MS}
        onFileClick={setDiffFile}
      />

      {/* Diff overlay — floats above everything */}
      {diffFile && (
        <FileDiffOverlay file={diffFile} onClose={() => setDiffFile(null)} />
      )}
    </div>
  );
}
