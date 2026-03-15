import { User } from "lucide-react";

interface UserMessageProps {
  text: string;
  timestamp?: string;
}

export function UserMessage({ text, timestamp }: UserMessageProps) {
  return (
    <div className="px-5 py-3">
      {/* User identity row */}
      <div
        className="mb-2.5 flex items-center gap-2 text-[11px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <span
          className="flex h-[18px] w-[18px] items-center justify-center rounded"
          style={{
            backgroundColor: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground, #fff)",
          }}
        >
          <User className="h-3 w-3" />
        </span>
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--vscode-sidebar-foreground)" }}
        >
          You
        </span>
        {timestamp && (
          <span style={{ opacity: 0.45 }}>{timestamp}</span>
        )}
      </div>

      {/* Message body */}
      <div
        className="text-[13px] leading-[1.65]"
        style={{ color: "var(--vscode-editor-foreground)", whiteSpace: "pre-wrap" }}
      >
        {text}
      </div>
    </div>
  );
}
