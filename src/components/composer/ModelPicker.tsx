import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ModelId =
  | "claude-opus-4-6"
  | "claude-sonnet-4-6"
  | "claude-haiku-4-5"
  | "gpt-4o"
  | "gemini-2-5-pro";

interface Model {
  id: ModelId;
  label: string;
  badge?: string;
  provider: "anthropic" | "openai" | "google";
}

const MODELS: Model[] = [
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", badge: "Powerful", provider: "anthropic" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", badge: "Fast", provider: "anthropic" },
  { id: "claude-haiku-4-5", label: "Claude Haiku 4.5", badge: "Lite", provider: "anthropic" },
  { id: "gpt-4o", label: "GPT 4o", provider: "openai" },
  { id: "gemini-2-5-pro", label: "Gemini 2.5 Pro", provider: "google" },
];

const SHORT_LABEL: Record<ModelId, string> = {
  "claude-opus-4-6": "Opus 4.6",
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-haiku-4-5": "Haiku 4.5",
  "gpt-4o": "GPT 4o",
  "gemini-2-5-pro": "Gemini 2.5",
};

interface ModelPickerProps {
  value?: ModelId;
  onChange?: (id: ModelId) => void;
}

export function ModelPicker({ value = "claude-sonnet-4-6", onChange }: ModelPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors hover:bg-white/5"
          style={{ color: "var(--vscode-editor-foreground)", opacity: 0.75 }}
        >
          {SHORT_LABEL[value]}
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
          Model
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ backgroundColor: "rgba(255,255,255,0.06)" }} />
        {MODELS.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange?.(m.id)}
            className="flex items-center justify-between gap-3 text-[12px]"
            style={{
              backgroundColor: value === m.id ? "rgba(255,255,255,0.06)" : undefined,
            }}
          >
            <span>{m.label}</span>
            {m.badge && (
              <span
                className="rounded px-1 py-0.5 text-[10px]"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", opacity: 0.7 }}
              >
                {m.badge}
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
