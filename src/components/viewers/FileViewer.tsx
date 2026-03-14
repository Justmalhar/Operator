import { Suspense, lazy, type ReactNode } from "react";
import { FileCode2, FileImage, FileSpreadsheet, FileText, Globe, Presentation, Table2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, getViewerDefinition, getViewerKind } from "./viewer-utils";

const CodeViewer = lazy(async () => ({
  default: (await import("./CodeViewer")).CodeViewer,
}));
const MarkdownViewer = lazy(async () => ({
  default: (await import("./MarkdownViewer")).MarkdownViewer,
}));
const ImageViewer = lazy(async () => ({
  default: (await import("./ImageViewer")).ImageViewer,
}));
const CsvViewer = lazy(async () => ({
  default: (await import("./CsvViewer")).CsvViewer,
}));
const XlsxViewer = lazy(async () => ({
  default: (await import("./XlsxViewer")).XlsxViewer,
}));
const PdfViewer = lazy(async () => ({
  default: (await import("./PdfViewer")).PdfViewer,
}));
const DocxViewer = lazy(async () => ({
  default: (await import("./DocxViewer")).DocxViewer,
}));
const PptViewer = lazy(async () => ({
  default: (await import("./PptViewer")).PptViewer,
}));
const WebBrowserViewer = lazy(async () => ({
  default: (await import("./WebBrowserViewer")).WebBrowserViewer,
}));

const viewerIcons = {
  binary: FileText,
  code: FileCode2,
  csv: Table2,
  docx: FileText,
  image: FileImage,
  markdown: FileText,
  pdf: FileText,
  ppt: Presentation,
  web: Globe,
  xlsx: FileSpreadsheet,
} as const;

function UnsupportedViewer({ filename, filePath, className }: BaseViewerProps) {
  const viewer = getViewerDefinition(filename);
  const Icon = viewerIcons.binary;

  return (
    <div className={cn("flex h-full items-center justify-center bg-[#1e1e1e] px-8", className)}>
      <div className="max-w-lg rounded-2xl border border-white/10 bg-[#252526] p-6 text-sm text-[#cccccc] shadow-2xl shadow-black/20">
        <div className="mb-4 flex items-center gap-3 text-white">
          <div className="rounded-lg border border-white/10 bg-black/20 p-2">
            <Icon className="size-5" />
          </div>
          <div>
            <p className="font-medium">{filename}</p>
            <p className="text-xs text-[#8b8b8b]">{viewer.description}</p>
          </div>
        </div>
        <p className="leading-6 text-[#b0b0b0]">
          This file type does not have a dedicated in-app renderer yet. Keep the
          registry on the tab shell and add a focused viewer when the backend starts
          exposing richer file metadata.
        </p>
        <p className="mt-4 rounded-lg border border-dashed border-white/10 bg-black/10 px-3 py-2 font-mono text-xs text-[#8b8b8b]">
          {filePath}
        </p>
      </div>
    </div>
  );
}

export function FileViewer({ filePath, filename, className }: BaseViewerProps) {
  const kind = getViewerKind(filename);

  const renderHeavyViewer = (node: ReactNode) => (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-[#8b8b8b]">
          Preparing preview...
        </div>
      }
    >
      {node}
    </Suspense>
  );

  if (kind === "markdown") {
    return renderHeavyViewer(<MarkdownViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "image") {
    return renderHeavyViewer(<ImageViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "csv") {
    return renderHeavyViewer(<CsvViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "xlsx") {
    return renderHeavyViewer(<XlsxViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "pdf") {
    return renderHeavyViewer(<PdfViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "docx") {
    return renderHeavyViewer(<DocxViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "ppt") {
    return renderHeavyViewer(<PptViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "web") {
    return renderHeavyViewer(<WebBrowserViewer filePath={filePath} filename={filename} className={className} />);
  }

  if (kind === "code") {
    return renderHeavyViewer(<CodeViewer filePath={filePath} filename={filename} className={className} />);
  }

  return <UnsupportedViewer filePath={filePath} filename={filename} className={className} />;
}
