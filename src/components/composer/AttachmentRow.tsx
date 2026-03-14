import { File, Image, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentRow({ attachments, onRemove }: AttachmentRowProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
      {attachments.map((att) => (
        <div
          key={att.id}
          className={cn(
            "group flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
          )}
          style={{
            backgroundColor: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "var(--vscode-editor-foreground)",
            maxWidth: "200px",
          }}
        >
          {att.type === "image" && att.url ? (
            <img
              src={att.url}
              alt={att.name}
              className="h-4 w-4 rounded object-cover"
            />
          ) : att.type === "image" ? (
            <Image className="h-3.5 w-3.5 shrink-0 opacity-60" />
          ) : (
            <File className="h-3.5 w-3.5 shrink-0 opacity-60" />
          )}
          <span className="min-w-0 truncate opacity-80">{att.name}</span>
          {att.size !== undefined && (
            <span className="shrink-0 opacity-40">{formatBytes(att.size)}</span>
          )}
          <button
            type="button"
            onClick={() => onRemove(att.id)}
            className="ml-0.5 shrink-0 rounded opacity-0 transition-opacity group-hover:opacity-60 hover:!opacity-100"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
