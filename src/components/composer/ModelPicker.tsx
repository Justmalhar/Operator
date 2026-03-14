import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-opus-4-6", label: "Opus 4.6" },
  { id: "claude-haiku-4-5", label: "Haiku 4.5" },
];

export function ModelPicker() {
  const [selectedId, setSelectedId] = useState("claude-sonnet-4-6");
  const [open, setOpen] = useState(false);
  const selected = MODELS.find((m) => m.id === selectedId) ?? MODELS[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="vscode-list-item flex items-center gap-1 rounded px-2 py-[3px] text-[12px] transition-colors duration-75"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <Sparkles className="h-3 w-3" />
        <span>{selected?.label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute bottom-full left-0 z-20 mb-1 min-w-[140px] rounded border py-1 shadow-lg"
            style={{
              backgroundColor: "var(--vscode-sidebar-background)",
              borderColor: "var(--vscode-sidebar-section-header-border)",
            }}
          >
            {MODELS.map((model) => (
              <button
                key={model.id}
                type="button"
                onClick={() => { setSelectedId(model.id); setOpen(false); }}
                className={cn(
                  "vscode-list-item flex w-full items-center px-3 py-1.5 text-left text-[12px] transition-colors duration-75",
                  selectedId === model.id && "selected",
                )}
              >
                {model.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
