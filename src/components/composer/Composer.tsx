import { useRef, useState } from "react";
import { ArrowUp, Brain, ChevronDown, Circle, Map, Plus, Slash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposerTextarea } from "./ComposerTextarea";
import { AttachmentRow, type Attachment } from "./AttachmentRow";
import { ModelPicker, type ModelId } from "./ModelPicker";
import { FileMentionOverlay, type FileSuggestion } from "./FileMentionOverlay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SlashCommand {
  id: string;
  name: string;
  description: string;
}

const SLASH_COMMANDS: SlashCommand[] = [
  { id: "commit", name: "/commit", description: "Create a git commit" },
  { id: "review", name: "/review", description: "Review changes" },
  { id: "explain", name: "/explain", description: "Explain selected code" },
  { id: "fix", name: "/fix", description: "Fix a bug" },
  { id: "test", name: "/test", description: "Write tests" },
  { id: "refactor", name: "/refactor", description: "Refactor code" },
  { id: "deploy", name: "/deploy", description: "Deploy to Vercel" },
];

type ThinkingLevel = "off" | "low" | "medium" | "high";

interface ComposerProps {
  onSend?: (message: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  className?: string;
}

function ThinkingPicker({
  value,
  onChange,
}: {
  value: ThinkingLevel;
  onChange: (v: ThinkingLevel) => void;
}) {
  const isActive = value !== "off";
  const OPTIONS: { id: ThinkingLevel; label: string }[] = [
    { id: "off", label: "Off" },
    { id: "low", label: "Low" },
    { id: "medium", label: "Medium" },
    { id: "high", label: "High" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors hover:bg-white/5"
          style={{
            color: isActive ? "var(--vscode-focus-border, #007fd4)" : "rgba(255,255,255,0.55)",
          }}
        >
          <Brain className="h-3.5 w-3.5" />
          {value === "off" ? "Thinking" : OPTIONS.find((o) => o.id === value)?.label}
          <ChevronDown className="h-2.5 w-2.5 opacity-40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[160px]"
        style={{
          backgroundColor: "var(--vscode-dropdown-background, #252526)",
          border: "1px solid var(--vscode-dropdown-border, rgba(255,255,255,0.1))",
          color: "var(--vscode-dropdown-foreground, #cccccc)",
        }}
      >
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
          Extended Thinking
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className="text-[12px]"
            style={{ backgroundColor: value === opt.id ? "rgba(255,255,255,0.06)" : undefined }}
          >
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Composer({ onSend, disabled, className }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const [thinking, setThinking] = useState<ThinkingLevel>("off");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showFileMention, setShowFileMention] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [fileMentionQuery, setFileMentionQuery] = useState("");
  const [activeSlashIndex] = useState(0);
  const [activeFileIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = message.trim().length > 0 || attachments.length > 0;

  function handleSend() {
    if (!canSend || disabled) return;
    onSend?.(message.trim(), attachments);
    setMessage("");
    setAttachments([]);
    setShowSlashMenu(false);
    setShowFileMention(false);
  }

  function handleTextChange(val: string) {
    setMessage(val);

    if (val.startsWith("/") && !val.includes(" ")) {
      setSlashQuery(val.slice(1));
      setShowSlashMenu(true);
      setShowFileMention(false);
      return;
    }

    const atMatch = val.match(/@(\S*)$/);
    if (atMatch) {
      setFileMentionQuery(atMatch[1]);
      setShowFileMention(true);
      setShowSlashMenu(false);
      return;
    }

    setShowSlashMenu(false);
    setShowFileMention(false);
  }

  function handleFileSelect(file: FileSuggestion) {
    const mention = `@${file.path} `;
    setMessage((prev) => prev.replace(/@\S*$/, mention));
    setShowFileMention(false);
  }

  function handleSlashSelect(cmd: SlashCommand) {
    setMessage(cmd.name + " ");
    setShowSlashMenu(false);
    setSlashQuery("");
  }

  function handleAttachFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const newAttachments: Attachment[] = files.map((f) => ({
      id: `${f.name}-${Date.now()}`,
      name: f.name,
      type: f.type.startsWith("image/") ? "image" : "file",
      url: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      size: f.size,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const filteredSlashCmds = SLASH_COMMANDS.filter((c) =>
    c.name.toLowerCase().includes(slashQuery.toLowerCase()),
  );

  return (
    <div className={cn("relative px-2 pb-3 pt-1 sm:px-4 sm:pb-4", className)}>
      {/* Slash command overlay */}
      {showSlashMenu && filteredSlashCmds.length > 0 && (
        <div
          className="absolute bottom-full left-4 mb-1 w-72 overflow-hidden rounded-xl shadow-xl"
          style={{
            backgroundColor: "#1e1e1e",
            border: "1px solid rgba(255,255,255,0.1)",
            zIndex: 50,
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Commands
          </div>
          {filteredSlashCmds.map((cmd, i) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => handleSlashSelect(cmd)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors",
                i === activeSlashIndex ? "bg-white/10" : "hover:bg-white/5",
              )}
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              <Slash className="h-3 w-3 shrink-0 opacity-35" />
              <span className="font-medium">{cmd.name}</span>
              <span className="min-w-0 flex-1 truncate text-[10px] opacity-35">
                {cmd.description}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* File mention overlay */}
      <FileMentionOverlay
        query={fileMentionQuery}
        onSelect={handleFileSelect}
        visible={showFileMention}
        activeIndex={activeFileIndex}
      />

      {/* Single unified card */}
      <div
        className="overflow-hidden rounded-xl"
        style={{
          backgroundColor: "#1c1c1c",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Attachment previews inside card */}
        <AttachmentRow
          attachments={attachments}
          onRemove={(id) => setAttachments((a) => a.filter((x) => x.id !== id))}
        />

        {/* Textarea */}
        <div className="px-3.5 pt-3 pb-1">
          <ComposerTextarea
            value={message}
            onChange={handleTextChange}
            onSubmit={handleSend}
            disabled={disabled}
            placeholder="Ask to make changes, @mention files, run /commands"
          />
        </div>

        {/* Toolbar row */}
        <div className="flex items-center gap-0.5 px-2 pb-2.5 pt-1">
          {/* Left group: model, thinking, map */}
          <ModelPicker value={model} onChange={setModel} />
          <ThinkingPicker value={thinking} onChange={setThinking} />
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.35)" }}
            title="Context map"
          >
            <Map className="h-3.5 w-3.5" />
          </button>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right group: stop, add, send */}
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.25)" }}
            title="Stop"
          >
            <Circle className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
            style={{ color: "rgba(255,255,255,0.4)" }}
            title="Add attachment"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachFiles}
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend || disabled}
            className={cn(
              "ml-0.5 flex h-7 w-7 items-center justify-center rounded-full transition-all duration-150",
              canSend && !disabled
                ? "cursor-pointer opacity-100 hover:brightness-110 active:scale-95"
                : "cursor-not-allowed opacity-25",
            )}
            style={{
              backgroundColor:
                canSend && !disabled ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.12)",
              color: canSend && !disabled ? "#000" : "rgba(255,255,255,0.5)",
            }}
            title="Send (⌘↵)"
          >
            <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
