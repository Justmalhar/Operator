import { useEffect, useRef } from "react";
import { UserMessage } from "./UserMessage";
import { ToolCallMessage, type ToolCall } from "./ToolCallMessage";
import { FileChangeBadges } from "./FileChangeBadges";

interface FileChange {
  filename: string;
  added: number;
  removed: number;
}

interface AgentMsg {
  id: string;
  role: "assistant";
  content: string;
  toolCalls?: ToolCall[];
  fileChanges?: FileChange[];
  duration?: number;
  timestamp?: string;
}

interface UserMsg {
  id: string;
  role: "user";
  content: string;
  timestamp?: string;
}

type Message = AgentMsg | UserMsg;

const MOCK_MESSAGES: Message[] = [
  {
    id: "1",
    role: "user",
    content: "Set up the CLAUDE.md with repo conventions and add a skill for code review",
    timestamp: "2:41 PM",
  },
  {
    id: "2",
    role: "assistant",
    content:
      "Done. Here's what was set up:\n\n- Added `CLAUDE.md` with repo conventions, working agreements, and the shared asset path\n- Created `skills/code-review.md` with auto-invoke rules for PR review requests",
    toolCalls: [
      {
        id: "t1",
        tool: "Read",
        input: "CLAUDE.md",
        output: "# CLAUDE.md\n(empty)",
        duration: 42,
        status: "success",
      },
      {
        id: "t2",
        tool: "Write",
        input: "CLAUDE.md",
        output: "Written 312 bytes",
        duration: 18,
        status: "success",
      },
      {
        id: "t3",
        tool: "Write",
        input: "skills/code-review.md",
        output: "Written 204 bytes",
        duration: 14,
        status: "success",
      },
    ],
    fileChanges: [
      { filename: "CLAUDE.md", added: 12, removed: 0 },
      { filename: "skills/code-review.md", added: 6, removed: 0 },
    ],
    duration: 84000,
    timestamp: "2:42 PM",
  },
  {
    id: "3",
    role: "user",
    content: "The asset path should be within each skill folder, not at the root",
    timestamp: "2:43 PM",
  },
  {
    id: "4",
    role: "assistant",
    content:
      "Updated. Moved the shared asset reference inside the skill folder convention — each skill now carries its own `assets/` directory.",
    toolCalls: [
      {
        id: "t4",
        tool: "Edit",
        input: "CLAUDE.md — update asset path reference",
        output: "Replaced 1 occurrence",
        duration: 22,
        status: "success",
      },
    ],
    fileChanges: [{ filename: "CLAUDE.md", added: 2, removed: 1 }],
    duration: 31000,
    timestamp: "2:43 PM",
  },
];

function AgentMessage({ message }: { message: AgentMsg }) {
  return (
    <div className="px-3 py-2">
      <div
        className="mb-1.5 flex items-center gap-2 text-[11px]"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <span
          className="flex h-[18px] w-[18px] items-center justify-center rounded text-[10px] font-bold"
          style={{
            background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
            color: "#fff",
          }}
        >
          O
        </span>
        <span>Operator</span>
        {message.timestamp && <span>· {message.timestamp}</span>}
        {message.duration && (
          <span>· {(message.duration / 1000).toFixed(0)}s</span>
        )}
      </div>

      {message.toolCalls && message.toolCalls.length > 0 && (
        <ToolCallMessage toolCalls={message.toolCalls} duration={message.duration} />
      )}

      <div
        className="text-[13px] leading-relaxed"
        style={{ color: "var(--vscode-sidebar-foreground)", whiteSpace: "pre-wrap" }}
      >
        {message.content}
      </div>

      {message.fileChanges && message.fileChanges.length > 0 && (
        <FileChangeBadges changes={message.fileChanges} />
      )}
    </div>
  );
}

interface MessageListProps {
  workspaceId?: string;
}

export function MessageList({ workspaceId: _workspaceId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="vscode-scrollable h-full overflow-y-auto">
      <div className="pb-4 pt-2">
        {MOCK_MESSAGES.map((msg) =>
          msg.role === "user" ? (
            <UserMessage key={msg.id} text={msg.content} timestamp={msg.timestamp} />
          ) : (
            <AgentMessage key={msg.id} message={msg} />
          ),
        )}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
