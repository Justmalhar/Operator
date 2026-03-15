import { useEffect, useMemo, useRef, useState } from "react";
import { parse, type Element as ParsedElement, type Fill, type Slide } from "pptxtojson";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { type BaseViewerProps, useFileArrayBuffer } from "./viewer-utils";

interface PptElement {
  type: string;
  left?: number;
  top?: number;
  width?: number;
  height?: number;
  rotate?: number;
  fill?: Fill;
  borderColor?: string;
  borderWidth?: number;
  src?: string;
  content?: string;
  name?: string;
}

function getFillBackground(fill?: Fill) {
  if (!fill) {
    return undefined;
  }

  if (fill.type === "color") {
    return fill.value;
  }

  if (fill.type === "image") {
    return `url(${fill.value.picBase64})`;
  }

  return undefined;
}

function SlideElement({ element }: { element: PptElement }) {
  const baseStyle = {
    left: `${element.left ?? 0}px`,
    top: `${element.top ?? 0}px`,
    width: `${element.width ?? 0}px`,
    height: `${element.height ?? 0}px`,
    transform: element.rotate ? `rotate(${element.rotate}deg)` : undefined,
    background:
      getFillBackground(element.fill),
    border:
      element.borderWidth && element.borderColor
        ? `${element.borderWidth}px solid ${element.borderColor}`
        : undefined,
  };

  if (element.type === "image" && element.src) {
    return (
      <img
        alt={element.name ?? "Slide image"}
        className="absolute object-contain"
        src={element.src}
        style={baseStyle}
      />
    );
  }

  if (element.content) {
    return (
      <div
        className="absolute overflow-hidden"
        style={{ ...baseStyle, color: "var(--vscode-editor-foreground)" }}
        dangerouslySetInnerHTML={{ __html: element.content }}
      />
    );
  }

  return (
    <div
      className="absolute flex items-center justify-center overflow-hidden rounded border border-dashed text-[10px] uppercase tracking-[0.08em]"
      style={{
        ...baseStyle,
        borderColor: "var(--vscode-panel-border)",
        backgroundColor: "var(--vscode-toolbar-hover-background)",
        color: "var(--vscode-descriptionForeground)",
      }}
    >
      {element.type}
    </div>
  );
}

export function PptViewer({ filePath, filename, className }: BaseViewerProps) {
  const { data, error, loading } = useFileArrayBuffer(filePath);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(960);
  const [deck, setDeck] = useState<{ slides: Slide[]; size: { width: number; height: number } } | null>(null);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const nextWidth = entries[0]?.contentRect.width ?? 960;
      setWidth(nextWidth);
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!data) {
      return;
    }

    void parse(data).then((parsed) => {
      setDeck(parsed);
    });
  }, [data]);

  const slideScale = useMemo(() => {
    if (!deck) {
      return 1;
    }

    return Math.min((width - 48) / deck.size.width, 1);
  }, [deck, width]);

  if (loading) {
    return (
      <div
        className="flex h-full items-center justify-center text-sm"
        style={{ backgroundColor: "var(--vscode-editor-background)", color: "var(--vscode-descriptionForeground)" }}
      >
        Loading slide deck...
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div
        className="flex h-full items-center justify-center px-6 text-sm"
        style={{ backgroundColor: "var(--vscode-editor-background)", color: "var(--vscode-errorForeground)" }}
      >
        {error?.message ?? "Unable to render slide deck."}
      </div>
    );
  }

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
        <span>{deck.slides.length} slides</span>
      </div>
      <ScrollArea className="min-h-0 flex-1" style={{ backgroundColor: "var(--vscode-sidebar-background)" }}>
        <div ref={containerRef} className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
          {deck.slides.map((slide, slideIndex) => (
            <section
              key={slideIndex}
              className="rounded-2xl p-4 shadow-[0_30px_70px_rgba(0,0,0,0.15)]"
              style={{
                backgroundColor: "var(--vscode-editor-background)",
                border: "1px solid var(--vscode-panel-border)",
              }}
            >
              <div
                className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.08em]"
                style={{ color: "var(--vscode-descriptionForeground)" }}
              >
                <span>Slide {slideIndex + 1}</span>
                {slide.note ? <span>Speaker notes</span> : null}
              </div>
              <div
                className="relative overflow-hidden rounded-xl bg-white"
                style={{
                  height: `${deck.size.height * slideScale}px`,
                }}
              >
                <div
                  className="absolute left-0 top-0 origin-top-left"
                  style={{
                    width: `${deck.size.width}px`,
                    height: `${deck.size.height}px`,
                    transform: `scale(${slideScale})`,
                    background: getFillBackground(slide.fill) ?? "#ffffff",
                  }}
                >
                  {[...(slide.layoutElements ?? []), ...(slide.elements ?? [])].map((element, elementIndex) => (
                    <SlideElement key={`${slideIndex}-${elementIndex}`} element={element as ParsedElement as PptElement} />
                  ))}
                </div>
              </div>
              {slide.note ? (
                <div
                  className="mt-4 rounded-xl px-4 py-3 text-sm leading-6"
                  style={{
                    backgroundColor: "var(--vscode-toolbar-hover-background)",
                    border: "1px solid var(--vscode-panel-border)",
                    color: "var(--vscode-editor-foreground)",
                  }}
                >
                  {slide.note}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
