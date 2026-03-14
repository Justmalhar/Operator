import { MessageList } from "./MessageList";
import { Composer } from "@/components/composer/Composer";

interface ChatPanelProps {
  workspaceId?: string;
}

export function ChatPanel({ workspaceId }: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: "var(--vscode-editor-background)" }}>
      {/* Message list */}
      <div className="min-h-0 flex-1">
        <MessageList workspaceId={workspaceId} />
      </div>

      {/* Composer */}
      <Composer />
    </div>
  );
}
