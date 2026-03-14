import { useEffect, useMemo, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GlobalWorkerOptions, getDocument, type PDFDocumentProxy } from "pdfjs-dist";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, useFileArrayBuffer } from "./viewer-utils";

GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

interface PdfPageMetric {
  width: number;
  height: number;
}

function PdfPageCanvas({
  document,
  pageNumber,
  width,
}: {
  document: PDFDocumentProxy;
  pageNumber: number;
  width: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let cancelled = false;

    document.getPage(pageNumber).then(async (page) => {
      if (!canvasRef.current || cancelled) {
        return;
      }

      const viewport = page.getViewport({ scale: 1 });
      const scale = width / viewport.width;
      const scaledViewport = page.getViewport({ scale });
      const context = canvasRef.current.getContext("2d");

      if (!context) {
        return;
      }

      const outputScale = window.devicePixelRatio || 1;
      canvasRef.current.width = Math.floor(scaledViewport.width * outputScale);
      canvasRef.current.height = Math.floor(scaledViewport.height * outputScale);
      canvasRef.current.style.width = `${scaledViewport.width}px`;
      canvasRef.current.style.height = `${scaledViewport.height}px`;

      const renderTask = page.render({
        canvas: canvasRef.current,
        canvasContext: context,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
        viewport: scaledViewport,
      });

      await renderTask.promise;
    });

    return () => {
      cancelled = true;
    };
  }, [document, pageNumber, width]);

  return <canvas ref={canvasRef} className="rounded-lg shadow-[0_24px_60px_rgba(0,0,0,0.35)]" />;
}

export function PdfViewer({ filePath, filename, className }: BaseViewerProps) {
  const { data, error, loading } = useFileArrayBuffer(filePath);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [document, setDocument] = useState<PDFDocumentProxy | null>(null);
  const [pageMetrics, setPageMetrics] = useState<PdfPageMetric[]>([]);
  const [viewportWidth, setViewportWidth] = useState(860);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 860;
      setViewportWidth(Math.max(480, nextWidth - 64));
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!data) {
      return undefined;
    }

    let cancelled = false;
    let loadedDocument: PDFDocumentProxy | null = null;

    getDocument({ data }).promise.then(async (nextDocument) => {
      if (cancelled) {
        await nextDocument.destroy();
        return;
      }

      loadedDocument = nextDocument;
      const metrics = await Promise.all(
        Array.from({ length: nextDocument.numPages }, async (_, index) => {
          const page = await nextDocument.getPage(index + 1);
          const viewport = page.getViewport({ scale: 1 });
          return {
            width: viewport.width,
            height: viewport.height,
          };
        }),
      );

      if (!cancelled) {
        setDocument(nextDocument);
        setPageMetrics(metrics);
      }
    });

    return () => {
      cancelled = true;
      setDocument(null);
      setPageMetrics([]);
      void loadedDocument?.destroy();
    };
  }, [data]);

  const rowVirtualizer = useVirtualizer({
    count: pageMetrics.length,
    estimateSize: (index) => {
      const metric = pageMetrics[index];
      if (!metric) {
        return 1040;
      }

      return metric.height * (viewportWidth / metric.width) + 56;
    },
    getScrollElement: () => parentRef.current,
    overscan: 2,
  });

  const pageLabel = useMemo(() => {
    if (!document) {
      return "PDF Preview";
    }

    return `${document.numPages} pages`;
  }, [document]);

  if (loading) {
    return <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-[#8b8b8b]">Loading PDF...</div>;
  }

  if (error || !document) {
    return (
      <div className="flex h-full items-center justify-center bg-[#1e1e1e] px-6 text-sm text-[#ff9b8a]">
        {error?.message ?? "Unable to render PDF."}
      </div>
    );
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1e1e1e]", className)}>
      <div className="flex items-center justify-between border-b border-white/8 bg-[#181818] px-4 py-2 text-xs text-[#8b8b8b]">
        <span className="font-mono">{filename}</span>
        <span>{pageLabel}</span>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 bg-[#252526]">
        <div ref={parentRef} className="h-full overflow-auto px-8 py-8">
          <div
            className="relative mx-auto"
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: `${viewportWidth}px`,
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const metric = pageMetrics[virtualRow.index];
              const scale = metric ? viewportWidth / metric.width : 1;
              const height = metric ? metric.height * scale : 0;

              return (
                <div
                  key={virtualRow.key}
                  className="absolute left-0 flex w-full justify-center"
                  style={{
                    top: 0,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="flex flex-col items-center gap-3">
                    <PdfPageCanvas document={document} pageNumber={virtualRow.index + 1} width={viewportWidth} />
                    <div
                      className="text-xs text-[#8b8b8b]"
                      style={{
                        minHeight: `${Math.max(0, height - 20)}px`,
                      }}
                    >
                      Page {virtualRow.index + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
