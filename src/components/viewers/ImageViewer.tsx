import { useState } from "react";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, getFileSourceUrl } from "./viewer-utils";

export function ImageViewer({ filePath, filename, className }: BaseViewerProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1e1e1e]", className)}>
      <div className="flex items-center justify-between border-b border-white/8 bg-[#181818] px-4 py-2 text-xs text-[#8b8b8b]">
        <span className="font-mono">{filename}</span>
        <span>{dimensions ? `${dimensions.width} x ${dimensions.height}` : "Image Preview"}</span>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto bg-[linear-gradient(45deg,#252526_25%,#1f1f1f_25%,#1f1f1f_50%,#252526_50%,#252526_75%,#1f1f1f_75%,#1f1f1f_100%)] bg-[length:32px_32px] p-10">
        <img
          alt={filename}
          className="max-h-full max-w-full rounded-lg border border-white/10 bg-white/95 shadow-2xl shadow-black/40"
          src={getFileSourceUrl(filePath)}
          onLoad={(event) => {
            setDimensions({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            });
          }}
        />
      </div>
    </div>
  );
}
