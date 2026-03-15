import { File, X } from "lucide-react";

export interface Attachment {
  id: string;
  name: string;
  type: "image" | "file";
  url?: string;
  size?: number;
}

interface AttachmentRowProps {
  attachments: Attachment[];
  onRemove: (id: string) => void;
}

export function AttachmentRow({ attachments, onRemove }: AttachmentRowProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 px-3 pt-3">
      {attachments.map((att) => (
        <div
          key={att.id}
          className="group relative flex items-center gap-2.5 rounded-lg"
          style={{
            backgroundColor: "var(--vscode-toolbar-hover-background)",
            border: "1px solid var(--vscode-panel-border)",
            padding: "8px 10px",
          }}
        >
          {/* Thumbnail */}
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md"
            style={{ backgroundColor: "var(--vscode-toolbar-hover-background)" }}
          >
            {att.type === "image" && att.url ? (
              <img src={att.url} alt={att.name} className="h-full w-full object-cover" />
            ) : (
              <File className="h-5 w-5" style={{ color: "var(--vscode-icon-foreground)", opacity: 0.5 }} />
            )}
          </div>

          {/* Info */}
          <div className="min-w-0">
            <div
              className="max-w-[140px] truncate text-[12px] font-medium"
              style={{ color: "var(--vscode-editor-foreground)" }}
            >
              {att.name}
            </div>
            <div
              className="mt-0.5 text-[10px] font-medium uppercase tracking-wider"
              style={{ color: "var(--vscode-input-placeholder-foreground)" }}
            >
              {att.type}
            </div>
          </div>

          {/* Remove button */}
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
            style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          >
            <X className="h-2.5 w-2.5 text-white" />
          </button>
        </div>
      ))}
    </div>
  );
}
