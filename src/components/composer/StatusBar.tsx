import { GitBranch, HardDrive, Shield } from "lucide-react";

export function StatusBar() {
  return (
    <div
      className="flex shrink-0 items-center justify-between px-3 py-1 text-[11px]"
      style={{
        color: "var(--vscode-tab-inactive-foreground)",
        borderTop: "1px solid var(--vscode-sidebar-section-header-border)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="vscode-list-item flex items-center gap-1 rounded px-1.5 py-[2px] transition-colors duration-75"
        >
          <HardDrive className="h-3 w-3" />
          Local
        </button>
        <button
          type="button"
          className="vscode-list-item flex items-center gap-1 rounded px-1.5 py-[2px] transition-colors duration-75"
        >
          <Shield className="h-3 w-3" />
          Full access
        </button>
      </div>

      <button
        type="button"
        className="vscode-list-item flex items-center gap-1 rounded px-1.5 py-[2px] transition-colors duration-75"
      >
        <GitBranch className="h-3 w-3" />
        main
      </button>
    </div>
  );
}
