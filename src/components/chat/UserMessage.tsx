import { User } from "lucide-react";

interface UserMessageProps {
  text: string;
  timestamp?: string;
}

export function UserMessage({ text, timestamp }: UserMessageProps) {
  return (
    <div className="px-6 py-3">
      {/* User identity row */}
      <div
        className="mb-2.5 flex items-center gap-2 text-[11px]"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        <span
          className="flex h-[18px] w-[18px] items-center justify-center rounded"
          style={{
            backgroundColor: "rgba(255,255,255,0.12)",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          <User className="h-3 w-3" />
        </span>
        <span className="text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.8)" }}>
          You
        </span>
        {timestamp && <span style={{ opacity: 0.45 }}>{timestamp}</span>}
      </div>

      {/* Message body */}
      <div
        className="text-[13px] leading-[1.65]"
        style={{ color: "rgba(255,255,255,0.82)", whiteSpace: "pre-wrap" }}
      >
        {text}
      </div>
    </div>
  );
}
