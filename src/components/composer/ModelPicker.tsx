import { Asterisk, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ModelId =
  | "claude-sonnet-4-6"
  | "claude-opus-4-6"
  | "claude-opus-4-6-1m"
  | "gpt-5-4"
  | "gpt-5-3-codex-spark"
  | "gpt-5-3-codex"
  | "gpt-5-2-codex";

interface Model {
  id: ModelId;
  label: string;
  badge?: string;
  provider: "anthropic" | "openai";
  group: "claude" | "gpt";
}

const MODELS: Model[] = [
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", badge: "Fast", provider: "anthropic", group: "claude" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", badge: "Powerful", provider: "anthropic", group: "claude" },
  { id: "claude-opus-4-6-1m", label: "Claude Opus 4.6 1M", badge: "1M ctx", provider: "anthropic", group: "claude" },
  { id: "gpt-5-4", label: "GPT-5.4", provider: "openai", group: "gpt" },
  { id: "gpt-5-3-codex-spark", label: "GPT-5.3 Codex Spark", provider: "openai", group: "gpt" },
  { id: "gpt-5-3-codex", label: "GPT-5.3 Codex", provider: "openai", group: "gpt" },
  { id: "gpt-5-2-codex", label: "GPT-5.2 Codex", provider: "openai", group: "gpt" },
];

const SHORT_LABEL: Record<ModelId, string> = {
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-opus-4-6": "Opus 4.6",
  "claude-opus-4-6-1m": "Opus 4.6 1M",
  "gpt-5-4": "GPT-5.4",
  "gpt-5-3-codex-spark": "GPT-5.3 Spark",
  "gpt-5-3-codex": "GPT-5.3 Codex",
  "gpt-5-2-codex": "GPT-5.2 Codex",
};

interface ModelPickerProps {
  value?: ModelId;
  onChange?: (id: ModelId) => void;
}

const claudeModels = MODELS.filter((m) => m.group === "claude");
const gptModels = MODELS.filter((m) => m.group === "gpt");

export function ModelPicker({ value = "claude-sonnet-4-6", onChange }: ModelPickerProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] font-medium transition-colors theme-hover-bg"
          style={{ color: "var(--vscode-input-foreground)" }}
        >
          <Asterisk className="h-3.5 w-3.5" style={{ color: "var(--vscode-icon-foreground)" }} />
          {SHORT_LABEL[value]}
          <ChevronDown className="h-2.5 w-2.5 opacity-40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[200px]"
        style={{
          backgroundColor: "var(--vscode-dropdown-background)",
          border: "1px solid var(--vscode-dropdown-border, var(--vscode-panel-border))",
          color: "var(--vscode-dropdown-foreground)",
        }}
      >
        <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
          Claude
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
        {claudeModels.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange?.(m.id)}
            className="flex items-center justify-between gap-3 text-[12px]"
            style={{
              backgroundColor: value === m.id ? "var(--vscode-toolbar-hover-background)" : undefined,
            }}
          >
            <span>{m.label}</span>
            {m.badge && (
              <span
                className="rounded px-1 py-0.5 text-[10px]"
                style={{ backgroundColor: "var(--vscode-toolbar-hover-background)", opacity: 0.85 }}
              >
                {m.badge}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuLabel className="mt-1 text-[10px] font-semibold uppercase tracking-wider opacity-50">
          OpenAI
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
        {gptModels.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange?.(m.id)}
            className="flex items-center justify-between gap-3 text-[12px]"
            style={{
              backgroundColor: value === m.id ? "var(--vscode-toolbar-hover-background)" : undefined,
            }}
          >
            <span>{m.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
