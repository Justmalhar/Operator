import { Play, Square, RotateCcw } from "lucide-react";
import { useState } from "react";

interface RunScript {
  id: string;
  name: string;
  command: string;
  description?: string;
}

const SCRIPTS: RunScript[] = [
  { id: "dev", name: "dev", command: "bun run dev", description: "Start development server" },
  { id: "build", name: "build", command: "bun run build", description: "Build for production" },
  { id: "test", name: "test", command: "bun run test", description: "Run test suite" },
  { id: "lint", name: "lint", command: "bun run lint", description: "Run linter" },
  { id: "typecheck", name: "typecheck", command: "bun run tsc --noEmit", description: "Type check" },
];

export function RunTab() {
  const [running, setRunning] = useState<string | null>("dev");

  return (
    <div className="flex h-full flex-col">
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1">
        {SCRIPTS.map((script) => {
          const isRunning = running === script.id;
          return (
            <div
              key={script.id}
              className="flex items-center gap-2 px-3 py-[5px]"
            >
              {/* Run/Stop button */}
              <button
                type="button"
                onClick={() => setRunning(isRunning ? null : script.id)}
                className="vscode-list-item flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded transition-colors duration-75"
                aria-label={isRunning ? "Stop" : "Run"}
              >
                {isRunning ? (
                  <Square className="h-3 w-3" style={{ color: "#f48771" }} />
                ) : (
                  <Play className="h-3 w-3" style={{ color: "#4ec994" }} />
                )}
              </button>

              {/* Script info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className="text-[13px] font-medium"
                    style={{ color: "var(--vscode-sidebar-foreground)" }}
                  >
                    {script.name}
                  </span>
                  {isRunning && (
                    <span
                      className="inline-flex h-[6px] w-[6px] rounded-full"
                      style={{ backgroundColor: "#4ec994", boxShadow: "0 0 4px #4ec994" }}
                    />
                  )}
                </div>
                <p
                  className="text-[11px] truncate"
                  style={{ color: "var(--vscode-tab-inactive-foreground)" }}
                >
                  {script.description ?? script.command}
                </p>
              </div>

              {/* Restart button (only when running) */}
              {isRunning && (
                <button
                  type="button"
                  className="vscode-list-item flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded transition-colors duration-75"
                  aria-label="Restart"
                >
                  <RotateCcw className="h-3 w-3" style={{ color: "var(--vscode-tab-inactive-foreground)" }} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
