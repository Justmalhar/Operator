interface UserMessageProps {
  text: string;
  timestamp?: string;
}

export function UserMessage({ text, timestamp }: UserMessageProps) {
  return (
    <div className="flex justify-end px-3 py-2">
      <div className="max-w-[80%]">
        <div
          className="rounded-2xl rounded-br-sm px-3.5 py-2.5 text-[13px] leading-relaxed"
          style={{
            backgroundColor: "var(--vscode-button-background)",
            color: "var(--vscode-button-foreground)",
          }}
        >
          {text}
        </div>
        {timestamp && (
          <p
            className="mt-1 text-right text-[11px]"
            style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          >
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}
