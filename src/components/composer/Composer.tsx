import { useState } from "react";
import { Paperclip, Mic, ArrowUp } from "lucide-react";
import { ComposerTextarea } from "./ComposerTextarea";
import { ModelPicker } from "./ModelPicker";
import { ReasoningPicker } from "./ReasoningPicker";
import { AttachmentRow } from "./AttachmentRow";
import { StatusBar } from "./StatusBar";

interface Attachment {
  id: string;
  name: string;
  type: "file" | "image";
}

interface ComposerProps {
  onSend?: (text: string, attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function Composer({ onSend, disabled = false }: ComposerProps) {
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  function handleSend() {
    if (!text.trim() || disabled) return;
    onSend?.(text.trim(), attachments);
    setText("");
    setAttachments([]);
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  }

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div
      className="shrink-0"
      style={{
        borderTop: "1px solid var(--vscode-sidebar-section-header-border)",
        backgroundColor: "var(--vscode-editor-background)",
      }}
    >
      {/* Attachment row */}
      <AttachmentRow attachments={attachments} onRemove={removeAttachment} />

      {/* Textarea */}
      <ComposerTextarea
        value={text}
        onChange={setText}
        onSubmit={handleSend}
        disabled={disabled}
      />

      {/* Toolbar row */}
      <div className="flex items-center gap-1 px-2 pb-2">
        {/* Left: attach + model + reasoning */}
        <button
          type="button"
          className="vscode-list-item flex h-7 w-7 items-center justify-center rounded transition-colors duration-75"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          aria-label="Attach file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        <ModelPicker />
        <ReasoningPicker />

        <div className="flex-1" />

        {/* Right: mic + send */}
        <button
          type="button"
          className="vscode-list-item flex h-7 w-7 items-center justify-center rounded transition-colors duration-75"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
          aria-label="Voice input"
        >
          <Mic className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="flex h-7 w-7 items-center justify-center rounded transition-colors duration-75"
          style={{
            backgroundColor: canSend
              ? "var(--vscode-button-background)"
              : "var(--vscode-list-inactive-selection-background)",
            color: canSend
              ? "var(--vscode-button-foreground)"
              : "var(--vscode-tab-inactive-foreground)",
            opacity: canSend ? 1 : 0.5,
            cursor: canSend ? "pointer" : "default",
          }}
          aria-label="Send message"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>

      {/* Status bar */}
      <StatusBar />
    </div>
  );
}
