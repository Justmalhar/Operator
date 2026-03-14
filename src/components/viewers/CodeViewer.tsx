import { useEffect, useMemo, useRef } from "react";
import type { Extension } from "@codemirror/state";
import { EditorState } from "@codemirror/state";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView, drawSelection, highlightActiveLineGutter, lineNumbers } from "@codemirror/view";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, formatBytes, getFileExtension, useFileText } from "./viewer-utils";

const codeTheme = EditorView.theme({
  "&": {
    height: "100%",
    backgroundColor: "#1e1e1e",
    color: "#d4d4d4",
    fontSize: "13px",
  },
  ".cm-scroller": {
    fontFamily: '"SF Mono", "Menlo", "Monaco", "Courier New", monospace',
    lineHeight: "1.6",
    paddingBottom: "2rem",
  },
  ".cm-content": {
    padding: "1rem 0",
  },
  ".cm-lineNumbers": {
    color: "#858585",
  },
  ".cm-gutters": {
    backgroundColor: "#1e1e1e",
    color: "#858585",
    borderRight: "1px solid rgba(255,255,255,0.08)",
  },
  ".cm-activeLineGutter": {
    color: "#c5c5c5",
  },
  ".cm-selectionBackground, ::selection": {
    backgroundColor: "rgba(38, 79, 120, 0.65) !important",
  },
});

async function getLanguageExtension(filename: string): Promise<Extension> {
  const extension = getFileExtension(filename);

  switch (extension) {
    case "ts":
      return (await import("@codemirror/lang-javascript")).javascript({ typescript: true });
    case "tsx":
      return (await import("@codemirror/lang-javascript")).javascript({ jsx: true, typescript: true });
    case "js":
    case "mjs":
    case "cjs":
      return (await import("@codemirror/lang-javascript")).javascript();
    case "jsx":
      return (await import("@codemirror/lang-javascript")).javascript({ jsx: true });
    case "json":
      return (await import("@codemirror/lang-json")).json();
    case "md":
    case "mdx":
    case "markdown":
      return (await import("@codemirror/lang-markdown")).markdown();
    case "html":
    case "htm":
    case "xml":
      return (await import("@codemirror/lang-html")).html();
    case "css":
    case "scss":
      return (await import("@codemirror/lang-css")).css();
    case "py":
      return (await import("@codemirror/lang-python")).python();
    case "rs":
      return (await import("@codemirror/lang-rust")).rust();
    case "go":
      return (await import("@codemirror/lang-go")).go();
    case "java":
      return (await import("@codemirror/lang-java")).java();
    case "php":
      return (await import("@codemirror/lang-php")).php();
    case "sql":
      return (await import("@codemirror/lang-sql")).sql();
    default:
      return [];
  }
}

export function CodeViewer({ filePath, filename, className }: BaseViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { data, error, loading } = useFileText(filePath);

  const headerMeta = useMemo(() => {
    if (!data) {
      return null;
    }

    const bytes = new TextEncoder().encode(data).length;
    const lineCount = data.split("\n").length;

    return {
      bytes,
      lineCount,
    };
  }, [data]);

  useEffect(() => {
    if (!containerRef.current || !data) {
      return undefined;
    }

    let cancelled = false;
    containerRef.current.innerHTML = "";

    let view: EditorView | null = null;

    void getLanguageExtension(filename).then((languageExtension) => {
      if (!containerRef.current || cancelled) {
        return;
      }

      const state = EditorState.create({
        doc: data,
        extensions: [
          oneDark,
          codeTheme,
          lineNumbers(),
          drawSelection(),
          highlightActiveLineGutter(),
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          EditorView.lineWrapping,
          languageExtension,
        ],
      });

      view = new EditorView({
        state,
        parent: containerRef.current,
      });
    });

    return () => {
      cancelled = true;
      view?.destroy();
    };
  }, [data, filename]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1e1e1e]", className)}>
      <div className="flex items-center justify-between border-b border-white/8 bg-[#181818] px-4 py-2 text-xs text-[#8b8b8b]">
        <div className="truncate font-mono">{filename}</div>
        {headerMeta ? (
          <div className="flex items-center gap-3">
            <span>{headerMeta.lineCount} lines</span>
            <span>{formatBytes(headerMeta.bytes)}</span>
          </div>
        ) : null}
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[#8b8b8b]">
            Loading file contents...
          </div>
        ) : null}
        {error ? (
          <div className="flex h-full items-center justify-center px-6 text-sm text-[#ff9b8a]">
            {error.message}
          </div>
        ) : null}
        {!loading && !error ? <div ref={containerRef} className="min-h-full" /> : null}
      </ScrollArea>
    </div>
  );
}
