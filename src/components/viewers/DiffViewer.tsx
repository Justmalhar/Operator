import { useEffect, useRef, useState } from "react";
import { EditorState } from "@codemirror/state";
import { MergeView } from "@codemirror/merge";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, drawSelection, highlightActiveLineGutter, lineNumbers } from "@codemirror/view";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DiffViewerProps {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  className?: string;
}

const diffTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "var(--vscode-editor-background)",
  },
  ".cm-scroller": {
    fontFamily: '"SF Mono", "Menlo", "Monaco", "Courier New", monospace',
    lineHeight: "1.6",
  },
  ".cm-gutters": {
    backgroundColor: "var(--vscode-editor-background)",
    color: "#858585",
    borderRight: "1px solid var(--vscode-panel-border)",
  },
});

export function DiffViewer({ filePath, originalContent, modifiedContent, className }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<MergeView | null>(null);
  const [sideBySide, setSideBySide] = useState(true);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    containerRef.current.innerHTML = "";

    viewRef.current = new MergeView({
      parent: containerRef.current,
      orientation: sideBySide ? "a-b" : "b-a",
      a: {
        doc: originalContent,
        extensions: [
          oneDark,
          diffTheme,
          lineNumbers(),
          drawSelection(),
          highlightActiveLineGutter(),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ],
      },
      b: {
        doc: modifiedContent,
        extensions: [
          oneDark,
          diffTheme,
          lineNumbers(),
          drawSelection(),
          highlightActiveLineGutter(),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
        ],
      },
      gutter: true,
      collapseUnchanged: {
        margin: 3,
        minSize: 4,
      },
      highlightChanges: true,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [filePath, modifiedContent, originalContent, sideBySide]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)} style={{ backgroundColor: "var(--vscode-editor-background)" }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid var(--vscode-panel-border)", backgroundColor: "var(--vscode-sidebar-background)" }}>
        <div className="truncate font-mono text-xs" style={{ color: "var(--vscode-icon-foreground)" }}>{filePath}</div>
        <Button
          className="h-8 text-xs theme-hover-bg"
          style={{ border: "1px solid var(--vscode-panel-border)", backgroundColor: "var(--vscode-input-background)", color: "var(--vscode-editor-foreground)" }}
          size="sm"
          type="button"
          variant="outline"
          onClick={() => setSideBySide((current) => !current)}
        >
          {sideBySide ? "Swap panes" : "Reset panes"}
        </Button>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 overflow-hidden" />
    </div>
  );
}
