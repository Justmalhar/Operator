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

export type ThinkingLevel = "off" | "low" | "medium" | "high";

interface ThinkingOption {
  id: ThinkingLevel;
  label: string;
  description: string;
}

const OPTIONS: ThinkingOption[] = [
  { id: "off", label: "Off", description: "No extended thinking" },
  { id: "low", label: "Low", description: "Quick reasoning pass" },
  { id: "medium", label: "Medium", description: "Balanced depth" },
  { id: "high", label: "High", description: "Deep reasoning" },
];

interface ReasoningPickerProps {
  value?: ThinkingLevel;
  onChange?: (level: ThinkingLevel) => void;
}

export function ReasoningPicker({ value = "off", onChange }: ReasoningPickerProps) {
  const isActive = value !== "off";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/5",
          )}
          style={{
            color: isActive ? "var(--vscode-focus-border, #007fd4)" : "var(--vscode-editor-foreground)",
            opacity: isActive ? 1 : 0.65,
          }}
        >
          <Brain className="h-3 w-3" />
          {value === "off" ? "Thinking" : OPTIONS.find((o) => o.id === value)?.label}
          <ChevronDown className="h-3 w-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[180px]"
        style={{
          backgroundColor: "var(--vscode-dropdown-background, #252526)",
          border: "1px solid var(--vscode-dropdown-border, rgba(255,255,255,0.1))",
          color: "var(--vscode-dropdown-foreground, #cccccc)",
        }}
      >
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
          Extended Thinking
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        {OPTIONS.map((opt) => (
          <DropdownMenuItem
            key={opt.id}
            onClick={() => onChange?.(opt.id)}
            className="flex flex-col items-start gap-0.5 text-[12px]"
            style={{
              backgroundColor: value === opt.id ? "rgba(255,255,255,0.06)" : undefined,
            }}
          >
            <span className="font-medium">{opt.label}</span>
            <span className="text-[10px] opacity-50">{opt.description}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
