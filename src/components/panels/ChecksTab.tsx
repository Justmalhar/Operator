import { CheckCircle2, XCircle, Clock, AlertCircle, RefreshCw } from "lucide-react";

type CheckStatus = "passed" | "failed" | "running" | "skipped";

interface Check {
  id: string;
  name: string;
  status: CheckStatus;
  duration?: string;
  message?: string;
}

const MOCK_CHECKS: Check[] = [
  { id: "1", name: "Type check", status: "passed", duration: "3.2s" },
  { id: "2", name: "Lint (ESLint)", status: "passed", duration: "1.8s" },
  { id: "3", name: "Unit tests", status: "running", message: "Running 24 tests..." },
  { id: "4", name: "Build", status: "skipped", message: "Waiting for tests" },
  { id: "5", name: "E2E tests", status: "skipped", message: "Waiting for build" },
];

const statusIcon = {
  passed: <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#4ec994" }} />,
  failed: <XCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#f48771" }} />,
  running: <RefreshCw className="h-3.5 w-3.5 shrink-0 animate-spin" style={{ color: "#3b9edd" }} />,
  skipped: <AlertCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.5 }} />,
};

const statusColor: Record<CheckStatus, string> = {
  passed: "#4ec994",
  failed: "#f48771",
  running: "#3b9edd",
  skipped: "var(--vscode-tab-inactive-foreground)",
};

export function ChecksTab() {
  const passed = MOCK_CHECKS.filter((c) => c.status === "passed").length;
  const failed = MOCK_CHECKS.filter((c) => c.status === "failed").length;
  const running = MOCK_CHECKS.filter((c) => c.status === "running").length;

  return (
    <div className="flex h-full flex-col">
      {/* Summary */}
      <div
        className="flex shrink-0 items-center gap-3 px-3 py-2 text-[12px]"
        style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border)" }}
      >
        <span className="flex items-center gap-1" style={{ color: "#4ec994" }}>
          <CheckCircle2 className="h-3 w-3" />
          {passed} passed
        </span>
        {failed > 0 && (
          <span className="flex items-center gap-1" style={{ color: "#f48771" }}>
            <XCircle className="h-3 w-3" />
            {failed} failed
          </span>
        )}
        {running > 0 && (
          <span className="flex items-center gap-1" style={{ color: "#3b9edd" }}>
            <Clock className="h-3 w-3" />
            {running} running
          </span>
        )}
      </div>

      {/* Check list */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1">
        {MOCK_CHECKS.map((check) => (
          <div
            key={check.id}
            className="flex items-start gap-2.5 px-3 py-[5px]"
          >
            <span className="mt-px">{statusIcon[check.status]}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-[13px] font-medium"
                  style={{ color: "var(--vscode-sidebar-foreground)" }}
                >
                  {check.name}
                </span>
                {check.duration && (
                  <span
                    className="shrink-0 text-[11px]"
                    style={{ color: "var(--vscode-tab-inactive-foreground)" }}
                  >
                    {check.duration}
                  </span>
                )}
              </div>
              {check.message && (
                <p
                  className="mt-0.5 text-[12px]"
                  style={{ color: statusColor[check.status], opacity: 0.8 }}
                >
                  {check.message}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
