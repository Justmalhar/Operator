import { useRef, useState } from "react";
import { ArrowUp, Map, Plus, Slash, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposerTextarea } from "./ComposerTextarea";
import { AttachmentRow, type Attachment } from "./AttachmentRow";
import { ModelPicker, type ModelId } from "./ModelPicker";
import { FileMentionOverlay, type FileSuggestion } from "./FileMentionOverlay";
import { ReasoningPicker, RadialContextIndicator, type ThinkingLevel } from "./ReasoningPicker";

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
  loading?: boolean;
  className?: string;
  isTerminalOpen?: boolean;
  onToggleTerminal?: () => void;
}


export function Composer({ onSend, disabled, loading, className, isTerminalOpen, onToggleTerminal }: ComposerProps) {
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [model, setModel] = useState<ModelId>("claude-sonnet-4-6");
  const [thinking, setThinking] = useState<ThinkingLevel>("off");
  const [planMode, setPlanMode] = useState(false);
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
    <div className={cn("relative px-4 pb-4 pt-2 sm:px-5 sm:pb-5", className)}>
      {/* Slash command overlay */}
      {showSlashMenu && filteredSlashCmds.length > 0 && (
        <div
          className="absolute bottom-full left-4 mb-1 w-72 overflow-hidden rounded-xl shadow-xl"
          style={{
            backgroundColor: "var(--vscode-editor-background)",
            border: "1px solid var(--vscode-panel-border)",
            zIndex: 50,
          }}
        >
          <div
            className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--vscode-input-placeholder-foreground)" }}
          >
            Commands
          </div>
          {filteredSlashCmds.map((cmd, i) => (
            <button
              key={cmd.id}
              type="button"
              onClick={() => handleSlashSelect(cmd)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[12px] transition-colors theme-hover-bg",
              )}
              style={{
                color: "var(--vscode-editor-foreground)",
                backgroundColor: i === activeSlashIndex ? "var(--vscode-toolbar-hover-background)" : undefined,
              }}
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
        className="overflow-hidden rounded-2xl transition-all duration-150"
        style={{
          backgroundColor: "var(--vscode-input-background)",
          border: "1px solid",
          borderColor: isFocused ? "var(--vscode-focusBorder, #007fd4)" : "var(--vscode-input-border, rgba(128,128,128,0.2))",
          boxShadow: isFocused
            ? "0 8px 32px rgba(0,0,0,0.08), 0 0 0 1px var(--vscode-focusBorder, #007fd4) inset"
            : "0 4px 16px rgba(0,0,0,0.06)",
        }}
      >
        {/* Attachment previews inside card */}
        <AttachmentRow
          attachments={attachments}
          onRemove={(id) => setAttachments((a) => a.filter((x) => x.id !== id))}
        />

        {/* Textarea */}
        <div className="px-4 pt-4 pb-2">
          <ComposerTextarea
            value={message}
            onChange={handleTextChange}
            onSubmit={handleSend}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            placeholder="Ask for code changes, @mention files, run /slash commands or add /skills"
          />
        </div>

        {/* Toolbar row */}
        <div className="flex items-center gap-4 px-3 pb-3 pt-2">
          {/* Left group: model, thinking, plan mode */}
          <ModelPicker value={model} onChange={setModel} />
          <ReasoningPicker variant="pill" value={thinking} onChange={setThinking} />
          <button
            type="button"
            onClick={() => setPlanMode((v) => !v)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-colors theme-hover-bg"
            style={{
              color: planMode ? "var(--vscode-focusBorder, var(--vscode-focus-border, #007fd4))" : "var(--vscode-icon-foreground)",
              backgroundColor: planMode ? "var(--vscode-focus-highlight-background, rgba(0,127,212,0.12))" : undefined,
              border: planMode ? "1px solid var(--vscode-focusBorder, #007fd4)" : "1px solid var(--vscode-separator-color, rgba(255,255,255,0.1))",
              padding: "0.5rem 0.75rem",
            }}
            title="Toggle Plan mode"
          >
            <Map className="h-3.5 w-3.5" />
            Plan
          </button>

          {/* Terminal toggle */}
          {onToggleTerminal && (
            <button
              type="button"
              onClick={onToggleTerminal}
              className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-colors theme-hover-bg"
              style={{
                color: isTerminalOpen ? "var(--vscode-focusBorder, var(--vscode-focus-border, #007fd4))" : "var(--vscode-icon-foreground)",
                backgroundColor: isTerminalOpen ? "var(--vscode-focus-highlight-background, rgba(0,127,212,0.12))" : undefined,
                border: isTerminalOpen ? "1px solid var(--vscode-focusBorder, #007fd4)" : "1px solid var(--vscode-separator-color, rgba(255,255,255,0.1))",
                padding: "0.5rem 0.75rem",
              }}
              title="Toggle Terminal (⌘`)"
            >
              <Terminal className="h-3.5 w-3.5" />
              Terminal
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Right group: context indicator, add, send */}
          <RadialContextIndicator percentage={0} />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors theme-hover-bg"
            style={{ color: "var(--vscode-icon-foreground)" }}
            title="Add attachment"
          >
            <Plus className="h-4 w-4" />
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
            disabled={!canSend || disabled || loading}
            className={cn(
              "ml-0.5 flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150",
              canSend && !disabled && !loading
                ? "cursor-pointer opacity-100 hover:brightness-110 active:scale-95"
                : "cursor-not-allowed opacity-40",
            )}
            style={{
              backgroundColor:
                canSend && !disabled ? "var(--vscode-button-background)" : "var(--vscode-toolbar-hover-background)",
              color: canSend && !disabled ? "var(--vscode-button-foreground)" : "var(--vscode-icon-foreground)",
            }}
            title={loading ? "Working…" : "Send (⌘↵)"}
          >
            {loading ? (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
