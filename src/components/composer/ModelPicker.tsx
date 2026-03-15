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
  | "claude-haiku-3-5"
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
  { id: "claude-haiku-3-5", label: "Claude Haiku 3.5", badge: "Lite", provider: "anthropic", group: "claude" },
  { id: "gpt-5-4", label: "GPT-5.4", badge: "New", provider: "openai", group: "gpt" },
  { id: "gpt-5-3-codex-spark", label: "GPT-5.3 Codex Spark", provider: "openai", group: "gpt" },
  { id: "gpt-5-3-codex", label: "GPT-5.3 Codex", provider: "openai", group: "gpt" },
  { id: "gpt-5-2-codex", label: "GPT-5.2 Codex", provider: "openai", group: "gpt" },
];

const SHORT_LABEL: Record<ModelId, string> = {
  "claude-sonnet-4-6": "Sonnet 4.6",
  "claude-opus-4-6": "Opus 4.6",
  "claude-opus-4-6-1m": "Opus 4.6 1M",
  "claude-haiku-3-5": "Haiku 3.5",
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
          className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-colors theme-hover-bg"
          style={{
            color: "var(--vscode-input-foreground)",
            border: "1px solid var(--vscode-separator-color, rgba(255,255,255,0.1))",
            padding: "0.5rem 0.75rem",
          }}
        >
          <Asterisk className="h-3.5 w-3.5" style={{ color: "var(--vscode-icon-foreground)" }} />
          {SHORT_LABEL[value]}
          <ChevronDown className="h-2.5 w-2.5 opacity-40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="min-w-[240px] p-2"
        style={{
          backgroundColor: "var(--vscode-dropdown-background)",
          border: "1px solid var(--vscode-dropdown-border, var(--vscode-panel-border))",
          color: "var(--vscode-dropdown-foreground)",
        }}
      >
        <DropdownMenuLabel className="px-2 py-2 text-[10px] font-semibold uppercase tracking-wider opacity-50">
          Claude
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" style={{ backgroundColor: "var(--vscode-separator-color)" }} />
        {claudeModels.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange?.(m.id)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-[12px]"
            style={{
              backgroundColor: value === m.id ? "var(--vscode-toolbar-hover-background)" : undefined,
            }}
          >
            <span className="flex-1">{m.label}</span>
            {m.badge && (
              <span
                className="ml-auto min-w-[44px] text-right text-[12px] font-medium opacity-50"
              >
                {m.badge}
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuLabel className="mt-2 px-2 py-2 text-[10px] font-semibold uppercase tracking-wider opacity-50">
          OpenAI
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" style={{ backgroundColor: "var(--vscode-separator-color)" }} />
        {gptModels.map((m) => (
          <DropdownMenuItem
            key={m.id}
            onClick={() => onChange?.(m.id)}
            className="flex items-center gap-3 rounded-md px-3 py-2 text-[12px]"
            style={{
              backgroundColor: value === m.id ? "var(--vscode-toolbar-hover-background)" : undefined,
            }}
          >
            <span className="flex-1">{m.label}</span>
            {m.badge && (
              <span
                className="ml-auto min-w-[44px] text-right text-[12px] font-medium"
                style={{ color: "var(--vscode-focusBorder, #007fd4)" }}
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
