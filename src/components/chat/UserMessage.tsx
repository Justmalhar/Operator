interface UserMessageProps {
  text: string;
  timestamp?: string;
}

export function UserMessage({ text, timestamp }: UserMessageProps) {
  return (
    <div className="flex justify-end px-6 py-2">
      <div className="flex max-w-[75%] flex-col items-end gap-1">
        <div
          className="rounded-xl px-4 py-2.5 text-[13px] leading-[1.65]"
          style={{
            backgroundColor: "var(--vscode-input-background)",
            border: "1px solid var(--vscode-panel-border)",
            color: "var(--vscode-input-foreground)",
            whiteSpace: "pre-wrap",
          }}
        >
          {text}
        </div>
        {timestamp && (
          <span
            className="text-[10px]"
            style={{ color: "var(--vscode-panel-title-inactive-foreground)" }}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
