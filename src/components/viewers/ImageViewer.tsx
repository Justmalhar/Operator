import { useState } from "react";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, getFileSourceUrl } from "./viewer-utils";

export function ImageViewer({ filePath, filename, className }: BaseViewerProps) {
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col", className)}
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 text-xs"
        style={{
          backgroundColor: "var(--vscode-viewer-header-background)",
          borderBottom: "1px solid var(--vscode-panel-border)",
          color: "var(--vscode-descriptionForeground)",
        }}
      >
        <span className="font-mono">{filename}</span>
        <span>{dimensions ? `${dimensions.width} x ${dimensions.height}` : "Image Preview"}</span>
      </div>
      <div
        className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-10"
        style={{
          background: `linear-gradient(45deg, var(--vscode-viewer-checkerboard-a) 25%, var(--vscode-viewer-checkerboard-b) 25%, var(--vscode-viewer-checkerboard-b) 50%, var(--vscode-viewer-checkerboard-a) 50%, var(--vscode-viewer-checkerboard-a) 75%, var(--vscode-viewer-checkerboard-b) 75%, var(--vscode-viewer-checkerboard-b) 100%)`,
          backgroundSize: "32px 32px",
        }}
      >
        <img
          alt={filename}
          className="max-h-full max-w-full rounded-lg bg-white/95 shadow-2xl"
          style={{ border: "1px solid var(--vscode-panel-border)" }}
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
