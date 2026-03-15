import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  /** Current width of the panel being resized */
  currentSize: number;
  /** Callback to update panel size */
  onResize: (newSize: number) => void;
  /** Minimum size in px */
  minSize?: number;
  /** Maximum size in px */
  maxSize?: number;
  /** Direction of resize: "left" means dragging resizes the left panel */
  direction?: "left" | "right";
  /** Orientation */
  orientation?: "vertical" | "horizontal";
  /** Double-click to reset to default */
  defaultSize?: number;
}

export function ResizeHandle({
  currentSize,
  onResize,
  minSize = 150,
  maxSize = 600,
  direction = "left",
  orientation = "vertical",
  defaultSize,
}: ResizeHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      startPosRef.current = orientation === "vertical" ? e.clientX : e.clientY;
      startSizeRef.current = currentSize;
    },
    [currentSize, orientation],
  );

  const handleDoubleClick = useCallback(() => {
    if (defaultSize !== undefined) {
      onResize(defaultSize);
    }
  }, [defaultSize, onResize]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pos = orientation === "vertical" ? e.clientX : e.clientY;
      const delta = pos - startPosRef.current;
      const multiplier = direction === "left" ? 1 : -1;
      const newSize = Math.min(maxSize, Math.max(minSize, startSizeRef.current + delta * multiplier));
      onResize(newSize);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    // Prevent text selection during drag
    document.body.style.cursor = orientation === "vertical" ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isDragging, onResize, minSize, maxSize, direction, orientation]);

  const isVertical = orientation === "vertical";

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      className={cn(
        "group relative flex shrink-0 items-center justify-center",
        isVertical ? "w-[4px] cursor-col-resize" : "h-[4px] cursor-row-resize",
        isDragging && "z-50",
      )}
      style={{
        background: isDragging
          ? "var(--vscode-focus-border, #007fd4)"
          : "transparent",
      }}
    >
      {/* Wider invisible hit target */}
      <div
        className={cn(
          "absolute",
          isVertical ? "inset-y-0 -left-[3px] -right-[3px]" : "inset-x-0 -top-[3px] -bottom-[3px]",
        )}
      />
      {/* Visible hover indicator */}
      <div
        className={cn(
          "absolute transition-opacity duration-150",
          isVertical
            ? "inset-y-0 w-[1px] left-[1.5px]"
            : "inset-x-0 h-[1px] top-[1.5px]",
          isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        style={{
          background: "var(--vscode-focus-border, #007fd4)",
        }}
      />
    </div>
  );
}
