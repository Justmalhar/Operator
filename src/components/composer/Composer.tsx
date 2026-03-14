import { useRef, useState } from "react";
import { ArrowUp, Paperclip, Slash } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposerTextarea } from "./ComposerTextarea";
import { AttachmentRow, type Attachment } from "./AttachmentRow";
import { ModelPicker, type ModelId } from "./ModelPicker";
import { ReasoningPicker, type ThinkingLevel } from "./ReasoningPicker";
import { StatusBar, type ContextMode, type EditMode } from "./StatusBar";
import { FileMentionOverlay, type FileSuggestion } from "./FileMentionOverlay";

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

interface ComposerProps {
  onSend?: (message: string, attachments: Attachment[]) => void;
  disabled?: boolean;
  className?: string;
}

export function Composer({ onSend, disabled, className }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const [thinking, setThinking] = useState<ThinkingLevel>("off");
  const [planMode, setPlanMode] = useState(false);
  const [contextMode, setContextMode] = useState<ContextMode>("local");
  const [editMode, setEditMode] = useState<EditMode>("auto");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showFileMention, setShowFileMention] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [fileMentionQuery, setFileMentionQuery] = useState("");
  const [activeSlashIndex] = useState(0);
  const [activeFileIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = message.trim().length > 0 || attachments.length > 0;

  const contextUsed = 80000;
  const contextMax = 200000;

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
    <div
      className={cn("relative flex flex-col", className)}
      style={{
        backgroundColor: "var(--vscode-editor-background)",
        borderTop: "1px solid var(--vscode-panel-border)",
      }}
    >
      {/* Slash command overlay */}
      {showSlashMenu && filteredSlashCmds.length > 0 && (
        <div
          className="absolute bottom-full left-4 mb-1 w-72 overflow-hidden rounded-md shadow-xl"
          style={{
            backgroundColor: "var(--vscode-dropdown-background, #252526)",
            border: "1px solid var(--vscode-dropdown-border, rgba(255,255,255,0.1))",
            zIndex: 50,
          }}
        >
          <div
            className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--vscode-editor-foreground)", opacity: 0.4 }}
          >
            Commands
          </div>
          {filteredSlashCmds.map((cmd, i) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => handleSlashSelect(cmd)}
              className={cn(
                "flex w-full items-center gap-2.5 px-2.5 py-1.5 text-left text-[12px] transition-colors",
                i === activeSlashIndex ? "bg-white/10" : "hover:bg-white/5",
              )}
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              <Slash className="h-3 w-3 shrink-0 opacity-40" />
              <span className="font-medium">{cmd.name}</span>
              <span className="min-w-0 flex-1 truncate text-[10px] opacity-40">{cmd.description}</span>
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

      {/* Attachment row */}
      <AttachmentRow attachments={attachments} onRemove={(id) => setAttachments((a) => a.filter((x) => x.id !== id))} />

      {/* Main input area */}
      <div className="mx-auto w-full max-w-[720px] px-5 py-3">
        <div
          className="rounded-lg px-3 py-2"
          style={{
            backgroundColor: "var(--vscode-input-background)",
            border: "1px solid var(--vscode-input-border, rgba(255,255,255,0.08))",
          }}
        >
          <ComposerTextarea
            value={message}
            onChange={handleTextChange}
            onSubmit={handleSend}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Toolbar row */}
      <div className="mx-auto flex w-full max-w-[720px] items-center gap-1 px-5 pb-2">
        <div className="flex flex-1 items-center gap-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/5"
            title="Add attachment"
            style={{ color: "var(--vscode-editor-foreground)", opacity: 0.5 }}
          >
            <Paperclip className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleAttachFiles}
          />

          <ModelPicker value={model} onChange={setModel} />
          <ReasoningPicker value={thinking} onChange={setThinking} />

          <button
            type="button"
            onClick={() => { setMessage("/"); setShowSlashMenu(true); }}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
            style={{ color: "var(--vscode-editor-foreground)", opacity: 0.4 }}
            title="Slash commands"
          >
            <Slash className="h-3 w-3" />
            Commands
          </button>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend || disabled}
          className={cn(
            "flex h-[28px] w-[28px] items-center justify-center rounded-lg transition-all duration-150",
            canSend && !disabled
              ? "opacity-100 hover:brightness-110 active:scale-95"
              : "cursor-not-allowed opacity-20",
          )}
          style={{
            backgroundColor: canSend && !disabled
              ? "var(--vscode-focus-border, #007fd4)"
              : "rgba(255,255,255,0.08)",
            color: "#fff",
          }}
          title="Send (⌘↵)"
        >
          <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>
      </div>

      {/* Status bar */}
      <StatusBar
        contextMode={contextMode}
        onContextModeChange={setContextMode}
        editMode={editMode}
        onEditModeChange={setEditMode}
        planMode={planMode}
        onPlanModeChange={setPlanMode}
        contextUsed={contextUsed}
        contextMax={contextMax}
      />
    </div>
  );
}
