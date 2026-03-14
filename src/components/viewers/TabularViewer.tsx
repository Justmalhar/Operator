import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { cn } from "@/lib/utils";

interface TabularViewerProps {
  columns: string[];
  rows: string[][];
  summary: string;
  className?: string;
}

const ROW_HEIGHT = 34;
const CELL_MIN_WIDTH = 160;

export function TabularViewer({ columns, rows, summary, className }: TabularViewerProps) {
  const parentRef = useRef<HTMLDivElement | null>(null);
  const columnCount = Math.max(columns.length, ...rows.map((row) => row.length), 1);

  const normalizedColumns = useMemo(
    () => Array.from({ length: columnCount }, (_, index) => columns[index] ?? `Column ${index + 1}`),
    [columnCount, columns],
  );

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => ROW_HEIGHT,
    getScrollElement: () => parentRef.current,
    overscan: 12,
  });

  const totalWidth = Math.max(columnCount * CELL_MIN_WIDTH, 960);

  return (
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1e1e1e]", className)}>
      <div className="border-b border-white/8 bg-[#181818] px-4 py-2 text-xs text-[#8b8b8b]">
        {summary}
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div style={{ minWidth: totalWidth }}>
          <div
            className="sticky top-0 z-20 grid border-b border-white/10 bg-[#252526] text-xs uppercase tracking-[0.08em] text-[#8b8b8b]"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(${CELL_MIN_WIDTH}px, 1fr))` }}
          >
            {normalizedColumns.map((column) => (
              <div key={column} className="truncate border-r border-white/8 px-3 py-2 last:border-r-0">
                {column}
              </div>
            ))}
          </div>
          <div ref={parentRef} className="h-[calc(100vh-18rem)] overflow-auto">
            <div
              className="relative"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const row = rows[virtualRow.index] ?? [];

                return (
                  <div
                    key={virtualRow.key}
                    className="absolute left-0 grid border-b border-white/6 text-sm text-[#d4d4d4] odd:bg-white/[0.02]"
                    style={{
                      gridTemplateColumns: `repeat(${columnCount}, minmax(${CELL_MIN_WIDTH}px, 1fr))`,
                      top: 0,
                      transform: `translateY(${virtualRow.start}px)`,
                      width: "100%",
                    }}
                  >
                    {normalizedColumns.map((_, cellIndex) => (
                      <div
                        key={`${virtualRow.key}-${cellIndex}`}
                        className="truncate border-r border-white/6 px-3 py-2 font-mono text-[12px] last:border-r-0"
                      >
                        {row[cellIndex] ?? ""}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
