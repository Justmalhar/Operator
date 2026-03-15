import { useEffect, useRef } from "react";
import { renderAsync } from "docx-preview";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, useFileArrayBuffer } from "./viewer-utils";

export function DocxViewer({ filePath, filename, className }: BaseViewerProps) {
  const { data, error, loading } = useFileArrayBuffer(filePath);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || !containerRef.current) {
      return;
    }

    containerRef.current.innerHTML = "";

    void renderAsync(data, containerRef.current, undefined, {
      className: "docx-preview-surface",
      breakPages: true,
      inWrapper: false,
      ignoreFonts: false,
      ignoreHeight: false,
      ignoreWidth: false,
      renderHeaders: true,
      renderFooters: true,
    });
  }, [data]);

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
        <span>Word Preview</span>
      </div>
      <ScrollArea className="min-h-0 flex-1 px-8 py-8" style={{ backgroundColor: "var(--vscode-sidebar-background)" }}>
        {loading ? (
          <div
            className="flex h-full items-center justify-center text-sm"
            style={{ color: "var(--vscode-descriptionForeground)" }}
          >
            Rendering document...
          </div>
        ) : null}
        {error ? (
          <div
            className="flex h-full items-center justify-center px-6 text-sm"
            style={{ color: "var(--vscode-errorForeground)" }}
          >
            {error.message}
          </div>
        ) : null}
        {!loading && !error ? <div ref={containerRef} className="docx-preview-host mx-auto max-w-5xl" /> : null}
      </ScrollArea>
    </div>
  );
}
