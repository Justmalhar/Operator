import { X, FileText, ImageIcon } from "lucide-react";

interface Attachment {
  id: string;
  name: string;
  type: "file" | "image";
}

interface AttachmentRowProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export function AttachmentRow({ attachments, onRemove }: AttachmentRowProps) {
  if (attachments.length === 0) return null;

  return (
    <div
      className="flex flex-wrap gap-1.5 px-3 pb-1 pt-2"
      style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border)" }}
    >
      {attachments.map((att) => (
        <div
          key={att.id}
          className="flex items-center gap-1.5 rounded px-2 py-[3px] text-[12px]"
          style={{
            backgroundColor: "var(--vscode-list-inactive-selection-background)",
            color: "var(--vscode-sidebar-foreground)",
          }}
        >
          {att.type === "image" ? (
            <ImageIcon className="h-3 w-3 shrink-0" />
          ) : (
            <FileText className="h-3 w-3 shrink-0" />
          )}
          <span className="max-w-[120px] truncate">{att.name}</span>
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="flex h-3.5 w-3.5 items-center justify-center rounded transition-colors duration-75 hover:opacity-70"
            aria-label={`Remove ${att.name}`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
