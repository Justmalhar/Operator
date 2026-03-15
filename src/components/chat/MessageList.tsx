import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Copy, Folder, GitBranch, GitFork, RotateCcw, Terminal } from "lucide-react";
import { motion } from "framer-motion";
import { UserMessage } from "./UserMessage";
import { ToolCallMessage, type ToolCall } from "./ToolCallMessage";
import { FileChangeBadges } from "./FileChangeBadges";
import { staggerContainer, staggerItem, springs } from "@/lib/animations";
import { useWorkspaceStore } from "@/store/workspaceStore";
import type { Workspace, Repository } from "@/types/workspace";

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

// ── Workspace setup (initial state) ───────────────────────────────────────────

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code
      className="rounded px-1 py-px font-mono text-[13px]"
      style={{
        backgroundColor: "rgba(255,255,255,0.06)",
        color: "rgba(255,255,255,0.85)",
      }}
    >
      {children}
    </code>
  );
}

function SetupItem({
  icon,
  children,
  alignStart,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  alignStart?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 text-[13px] ${alignStart ? "items-start" : "items-center"}`}
      style={{ color: "rgba(255,255,255,0.55)" }}
    >
      <span className={`flex h-4 w-4 shrink-0 items-center justify-center opacity-50 ${alignStart ? "mt-0.5" : ""}`}>
        {icon}
      </span>
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}

interface WorkspaceSetupProps {
  workspace: Workspace | undefined;
  repo: Repository | undefined;
}

function WorkspaceSetup({ workspace, repo }: WorkspaceSetupProps) {
  const [scriptExpanded, setScriptExpanded] = useState(false);

  const cityName = workspace?.city_name ?? "workspace";
  const branchName = workspace?.branch_name ?? "main";
  const repoFullName = repo?.full_name ?? "origin";
  const defaultBranch = repo?.default_branch ?? "main";

  // Derive a sample setup script from operator_json if present, else show placeholder
  const setupScript = (() => {
    if (repo?.operator_json) {
      try {
        const parsed = JSON.parse(repo.operator_json) as { setup?: string };
        if (parsed.setup) return parsed.setup;
      } catch {}
    }
    return `#!/bin/bash\nset -e\n\n# Install dependencies\nnpm install\n\n# Build project\nnpm run build`;
  })();

  return (
    <motion.div
      className="px-6 pb-6 pt-10"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Setup card */}
      <motion.div
        variants={staggerItem}
        className="mb-5 inline-block max-w-[520px] rounded-xl px-4 py-3"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="text-[14px] font-medium" style={{ color: "rgba(255,255,255,0.9)" }}>
          You're in a new copy of <InlineCode>Operator</InlineCode> called{" "}
          <InlineCode>{cityName}</InlineCode>
        </span>
      </motion.div>

      {/* Status items */}
      <motion.div variants={staggerItem} className="flex flex-col gap-3.5">
        <SetupItem icon={<GitBranch className="h-3.5 w-3.5" />}>
          Branched <InlineCode>{repoFullName}/{cityName}</InlineCode> from{" "}
          <InlineCode>origin/{defaultBranch}</InlineCode>
        </SetupItem>

        <SetupItem icon={<Folder className="h-3.5 w-3.5" />}>
          Created workspace <InlineCode>{cityName}</InlineCode> from branch{" "}
          <InlineCode>{branchName}</InlineCode>
        </SetupItem>

        <SetupItem icon={<Terminal className="h-3.5 w-3.5" />} alignStart={scriptExpanded}>
          <div className="flex w-full flex-col gap-2">
            <div className="flex items-center gap-1.5">
              <span>Completed setup script</span>
              <button
                type="button"
                onClick={() => setScriptExpanded((v) => !v)}
                className="inline-flex items-center gap-0.5 rounded px-1 py-px text-[11px] transition-opacity hover:opacity-100"
                style={{ color: "rgba(255,255,255,0.4)", opacity: 0.7 }}
              >
                {scriptExpanded ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </div>
            {scriptExpanded && (
              <pre
                className="w-full overflow-x-auto rounded-md px-3 py-2.5 font-mono text-[12px] leading-relaxed"
                style={{
                  backgroundColor: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  color: "var(--vscode-terminal-ansi-green, #4ec994)",
                }}
              >
                {setupScript}
              </pre>
            )}
          </div>
        </SetupItem>
      </motion.div>
    </motion.div>
  );
}

// ── Message action buttons (visible on hover) ─────────────────────────────────

function MessageActions({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -4 }}
      whileInView={{ opacity: 0 }}
      className="absolute right-4 top-3 z-10 flex items-center overflow-hidden rounded-lg opacity-0 shadow-lg transition-opacity duration-100 group-hover:opacity-100"
      style={{
        backgroundColor: "#222",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <motion.button
        type="button"
        title="Copy message"
        onClick={() => navigator.clipboard.writeText(content)}
        whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        whileTap={{ scale: 0.9 }}
        className="flex h-[26px] w-[28px] items-center justify-center"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        <Copy className="h-3.5 w-3.5" />
      </motion.button>
      <motion.button
        type="button"
        title="Fork from here"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        whileTap={{ scale: 0.9 }}
        className="flex h-[26px] w-[28px] items-center justify-center"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        <GitFork className="h-3.5 w-3.5" />
      </motion.button>
      <motion.button
        type="button"
        title="Revert to here"
        whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
        whileTap={{ scale: 0.9 }}
        className="flex h-[26px] w-[28px] items-center justify-center"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        <RotateCcw className="h-3.5 w-3.5" />
      </motion.button>
    </motion.div>
  );
}

// ── Agent message ─────────────────────────────────────────────────────────────

function AgentMessage({ message }: { message: AgentMsg }) {
  return (
    <div className="px-6 py-3">
      {/* Tool calls */}
      {message.toolCalls && message.toolCalls.length > 0 && (
        <ToolCallMessage toolCalls={message.toolCalls} duration={message.duration} />
      )}

      {/* Message body */}
      <div
        className="text-[13px] leading-[1.65]"
        style={{ color: "var(--vscode-editor-foreground)", whiteSpace: "pre-wrap" }}
      >
        {message.content}
      </div>

      {/* File changes */}
      {message.fileChanges && message.fileChanges.length > 0 && (
        <FileChangeBadges changes={message.fileChanges} />
      )}
    </div>
  );
}

// ── MessageList ───────────────────────────────────────────────────────────────

interface MessageListProps {
  workspaceId?: string;
}

export function MessageList({ workspaceId }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const { repos, workspacesByRepo } = useWorkspaceStore();

  // Resolve workspace + repo from the provided id
  let workspace: Workspace | undefined;
  let repo: Repository | undefined;
  if (workspaceId) {
    for (const list of Object.values(workspacesByRepo)) {
      const found = (list as Workspace[]).find((w) => w.id === workspaceId);
      if (found) { workspace = found; break; }
    }
    if (workspace) {
      repo = repos.find((r) => r.id === workspace!.repository_id);
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div
      className="vscode-scrollable h-full overflow-y-auto"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      <div className="mx-auto max-w-[720px] pb-4">
        {/* Workspace setup header */}
        <WorkspaceSetup workspace={workspace} repo={repo} />

        {/* Conversation messages */}
        {MOCK_MESSAGES.map((msg, i) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.smooth, delay: i * 0.05 }}
          >
            {msg.role === "user" ? (
              <div className="group relative">
                <UserMessage text={msg.content} timestamp={msg.timestamp} />
                <MessageActions content={msg.content} />
              </div>
            ) : (
              <div className="group relative">
                <AgentMessage message={msg} />
                <MessageActions content={msg.content} />
              </div>
            )}
            {/* Hairline between conversation turns */}
            {i < MOCK_MESSAGES.length - 1 && MOCK_MESSAGES[i + 1].role === "user" && (
              <div
                className="mx-6 my-1"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              />
            )}
          </motion.div>
        ))}
      </div>
      <div ref={bottomRef} />
    </div>
  );
}
