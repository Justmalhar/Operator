import { CheckCircle2, Circle, Terminal } from "lucide-react";

interface SetupStep {
  id: string;
  label: string;
  command?: string;
  done: boolean;
}

const SETUP_STEPS: SetupStep[] = [
  { id: "1", label: "Node.js installed", done: true },
  { id: "2", label: "Dependencies installed", command: "bun install", done: true },
  { id: "3", label: "Environment variables configured", done: false },
  { id: "4", label: "Database migrated", command: "bun run db:migrate", done: false },
];

export function SetupTab() {
  return (
    <div className="vscode-scrollable h-full overflow-y-auto">
      <div className="px-3 py-3">
        <p className="mb-3 text-[12px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
          Workspace setup checklist
        </p>

        <div className="flex flex-col gap-2">
          {SETUP_STEPS.map((step) => (
            <div key={step.id} className="flex items-start gap-2.5">
              {step.done ? (
                <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" style={{ color: "#4ec994" }} />
              ) : (
                <Circle className="mt-px h-3.5 w-3.5 shrink-0" style={{ color: "var(--vscode-tab-inactive-foreground)" }} />
              )}
              <div className="min-w-0 flex-1">
                <p
                  className="text-[13px]"
                  style={{
                    color: step.done
                      ? "var(--vscode-tab-inactive-foreground)"
                      : "var(--vscode-sidebar-foreground)",
                    textDecoration: step.done ? "line-through" : undefined,
                    opacity: step.done ? 0.7 : 1,
                  }}
                >
                  {step.label}
                </p>
                {step.command && !step.done && (
                  <code
                    className="mt-0.5 flex items-center gap-1 text-[11px]"
                    style={{ color: "var(--vscode-tab-inactive-foreground)" }}
                  >
                    <Terminal className="h-2.5 w-2.5" />
                    {step.command}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
