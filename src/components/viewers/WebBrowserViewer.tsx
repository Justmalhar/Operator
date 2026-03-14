import { cn } from "@/lib/utils";
import { type BaseViewerProps, getFileSourceUrl } from "./viewer-utils";

export function WebBrowserViewer({ filePath, filename, className }: BaseViewerProps) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1e1e1e]", className)}>
      <div className="flex items-center gap-2 border-b border-white/8 bg-[#181818] px-4 py-2 text-xs text-[#8b8b8b]">
        <span className="rounded-full border border-white/10 px-2 py-0.5">Preview</span>
        <span className="truncate font-mono">{filename}</span>
      </div>
      <iframe
        className="min-h-0 flex-1 border-0 bg-white"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        src={getFileSourceUrl(filePath)}
        title={filename}
      />
    </div>
  );
}
