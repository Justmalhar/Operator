import { useState } from "react";
import { ChevronDown, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const LEVELS = [
  { id: "none", label: "No thinking" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

export function ReasoningPicker() {
  const [selectedId, setSelectedId] = useState("medium");
  const [open, setOpen] = useState(false);
  const selected = LEVELS.find((l) => l.id === selectedId) ?? LEVELS[2];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="vscode-list-item flex items-center gap-1 rounded px-2 py-[3px] text-[12px] transition-colors duration-75"
        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
      >
        <Brain className="h-3 w-3" />
        <span>{selected?.label}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute bottom-full left-0 z-20 mb-1 min-w-[130px] rounded border py-1 shadow-lg"
            style={{
              backgroundColor: "var(--vscode-sidebar-background)",
              borderColor: "var(--vscode-sidebar-section-header-border)",
            }}
          >
            {LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                onClick={() => { setSelectedId(level.id); setOpen(false); }}
                className={cn(
                  "vscode-list-item flex w-full items-center px-3 py-1.5 text-left text-[12px] transition-colors duration-75",
                  selectedId === level.id && "selected",
                )}
              >
                {level.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
