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
        className="mb-2 flex items-center gap-2 text-[11px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <span
          className="flex h-[20px] w-[20px] items-center justify-center rounded-md text-[10px] font-bold"
          style={{
            backgroundColor: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground, #fff)",
          }}
        >
          <User className="h-3 w-3" />
        </span>
        <span className="font-medium" style={{ color: "var(--vscode-sidebar-foreground)" }}>You</span>
        {timestamp && (
          <span className="opacity-60">{timestamp}</span>
        )}
      </div>

      {/* Message body */}
      <div
        className="text-[13px] leading-[1.6]"
        style={{ color: "var(--vscode-editor-foreground)", whiteSpace: "pre-wrap" }}
      >
        {text}
      </div>
    </div>
  );
}
