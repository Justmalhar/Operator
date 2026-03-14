import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, useFileText } from "./viewer-utils";

export function MarkdownViewer({ filePath, filename, className }: BaseViewerProps) {
  const { data, error, loading } = useFileText(filePath);

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1e1e1e]", className)}>
      <div className="flex items-center justify-between border-b border-white/8 bg-[#181818] px-4 py-2 text-xs text-[#8b8b8b]">
        <span className="font-mono">{filename}</span>
        <span>Markdown Preview</span>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-[#8b8b8b]">
            Rendering markdown...
          </div>
        ) : null}
        {error ? (
          <div className="flex h-full items-center justify-center px-6 text-sm text-[#ff9b8a]">
            {error.message}
          </div>
        ) : null}
        {data ? (
          <article className="markdown-preview mx-auto w-full max-w-4xl px-6 py-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {data}
            </ReactMarkdown>
          </article>
        ) : null}
      </ScrollArea>
    </div>
  );
}
