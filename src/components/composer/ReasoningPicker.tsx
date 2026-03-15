import { Brain, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// ── Shared types & primitives ─────────────────────────────────────────────────

export type ThinkingLevel = "off" | "low" | "medium" | "high";

const OPTIONS: { id: ThinkingLevel; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export function ThinkingRects({ level }: { level: ThinkingLevel }) {
  const counts: Record<ThinkingLevel, number> = { off: 0, low: 1, medium: 2, high: 3 };
  const count = counts[level];
  if (count === 0) return null;
  return (
    <span className="flex items-center gap-[2px]">
      {Array.from({ length: 3 }).map((_, i) => (
        <span
          key={i}
          className="inline-block rounded-[1px]"
          style={{
            width: "3px",
            height: i < count ? "10px" : "6px",
            backgroundColor: "currentColor",
            opacity: i < count ? 1 : 0.2,
          }}
        />
      ))}
    </span>
  );
}

export function RadialContextIndicator({ percentage = 0 }: { percentage?: number }) {
  const r = 7;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(percentage, 100) / 100) * circ;
  return (
    <button
      type="button"
      className="flex h-7 w-7 items-center justify-center rounded-md transition-colors theme-hover-bg"
      style={{ color: "var(--vscode-icon-foreground)" }}
      title={`${percentage}% context used`}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <circle cx="9" cy="9" r={r} stroke="currentColor" strokeWidth="1.5" opacity="0.2" />
        {percentage > 0 && (
          <circle
            cx="9" cy="9" r={r}
            stroke="currentColor" strokeWidth="1.5"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 9 9)"
          />
        )}
      </svg>
    </button>
  );
}

// ── ReasoningPicker ───────────────────────────────────────────────────────────

interface ReasoningPickerProps {
  value?: ThinkingLevel;
  onChange?: (level: ThinkingLevel) => void;
  /** "pill" matches the Composer toolbar style; "default" is the compact inline style */
  variant?: "default" | "pill";
}

export function ReasoningPicker({ value = "off", onChange, variant = "default" }: ReasoningPickerProps) {
  const isActive = value !== "off";

  const triggerClass = cn(
    "flex items-center gap-1.5 font-medium transition-colors theme-hover-bg",
    variant === "pill"
      ? "rounded-full px-4 py-2 text-[12px]"
      : "rounded px-2 py-1 text-[11px]",
  );

  const triggerStyle: React.CSSProperties = {
    color: isActive
      ? "var(--vscode-focusBorder, var(--vscode-focus-border, #007fd4))"
      : variant === "pill"
        ? "var(--vscode-icon-foreground)"
        : "var(--vscode-editor-foreground)",
    backgroundColor: isActive ? "var(--vscode-focus-highlight-background, rgba(0,127,212,0.12))" : undefined,
    border: variant === "pill"
      ? isActive
        ? "1px solid var(--vscode-focusBorder, #007fd4)"
        : "1px solid var(--vscode-separator-color, rgba(255,255,255,0.1))"
      : undefined,
    opacity: variant === "pill" ? undefined : isActive ? 1 : 0.65,
    padding: "0.5rem 0.75rem",
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={triggerClass} style={triggerStyle}>
          <Brain className="h-3.5 w-3.5" />
          {value === "off" ? "Thinking" : OPTIONS.find((o) => o.id === value)?.label}
          {isActive && <ThinkingRects level={value} />}
          <ChevronDown className="h-2.5 w-2.5 opacity-40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[220px] p-2"
        style={{
          backgroundColor: "var(--vscode-dropdown-background)",
          border: "1px solid var(--vscode-dropdown-border, var(--vscode-panel-border))",
          color: "var(--vscode-dropdown-foreground)",
        }}
      >
        <DropdownMenuLabel className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider opacity-50">
          Extended Thinking
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" style={{ backgroundColor: "var(--vscode-separator-color)" }} />
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => onChange?.(opt.id)}
            className="flex items-center justify-between gap-3 rounded-md px-3 py-2 text-[12px]"
            style={{ backgroundColor: value === opt.id ? "var(--vscode-toolbar-hover-background)" : undefined }}
          >
            <span>{opt.label}</span>
            <ThinkingRects level={opt.id} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
