import { ChevronDown, Cpu, GitBranch, Gauge } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type ContextMode = "local" | "full";
export type EditMode = "auto" | "ask";

interface StatusBarProps {
  contextMode: ContextMode;
  onContextModeChange: (mode: ContextMode) => void;
  editMode: EditMode;
  onEditModeChange: (mode: EditMode) => void;
  planMode: boolean;
  onPlanModeChange: (enabled: boolean) => void;
  contextUsed?: number;
  contextMax?: number;
}

function ContextBar({ used, max }: { used: number; max: number }) {
  const pct = Math.min((used / max) * 100, 100);
  const color = pct > 80 ? "#f14c4c" : pct > 60 ? "#cca700" : "var(--vscode-focus-border, #007fd4)";
  const tokensK = Math.round(used / 1000);
  const maxK = Math.round(max / 1000);
  return (
    <div className="flex items-center gap-1.5">
      <Gauge className="h-3 w-3 opacity-40" />
      <div className="relative h-[3px] w-16 overflow-hidden rounded-full" style={{ backgroundColor: "var(--vscode-separator-color)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[10px] tabular-nums opacity-35">{tokensK}k/{maxK}k</span>
    </div>
  );
}

export function StatusBar({
  contextMode,
  onContextModeChange,
  editMode,
  onEditModeChange,
  planMode,
  onPlanModeChange,
  contextUsed = 0,
  contextMax = 200000,
}: StatusBarProps) {
  const dropdownStyle = {
    backgroundColor: "var(--vscode-dropdown-background, #252526)",
    border: "1px solid var(--vscode-dropdown-border, rgba(255,255,255,0.1))",
    color: "var(--vscode-dropdown-foreground, #cccccc)",
  };

  return (
    <div
      className="flex items-center justify-between gap-2 px-5 py-1.5"
      style={{ borderTop: "1px solid var(--vscode-panel-border, var(--vscode-separator-color))" }}
    >
      {/* Left cluster */}
      <div className="flex items-center gap-0.5">
        {/* Context mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors theme-hover-bg"
              style={{ color: "var(--vscode-editor-foreground)", opacity: 0.55 }}
            >
              <Cpu className="h-3 w-3" />
              {contextMode === "local" ? "Local" : "Full Access"}
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]" style={dropdownStyle}>
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              Context
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
            <DropdownMenuItem
              onClick={() => onContextModeChange("local")}
              className="text-[12px]"
              style={{ backgroundColor: contextMode === "local" ? "var(--vscode-toolbar-hover-background)" : undefined }}
            >
              <div>
                <p className="font-medium">Local</p>
                <p className="text-[10px] opacity-50">Workspace files only</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onContextModeChange("full")}
              className="text-[12px]"
              style={{ backgroundColor: contextMode === "full" ? "var(--vscode-toolbar-hover-background)" : undefined }}
            >
              <div>
                <p className="font-medium">Full Access</p>
                <p className="text-[10px] opacity-50">All context sources</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <span className="mx-0.5 h-3 w-px" style={{ backgroundColor: "var(--vscode-separator-color)" }} />

        {/* Edit mode */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors theme-hover-bg"
              style={{
                color: "var(--vscode-editor-foreground)",
                opacity: editMode === "auto" ? 0.55 : 0.8,
              }}
            >
              <GitBranch className="h-3 w-3" />
              {editMode === "auto" ? "Auto" : "Ask"}
              <ChevronDown className="h-2.5 w-2.5 opacity-50" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[160px]" style={dropdownStyle}>
            <DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider opacity-50">
              Edit Mode
            </DropdownMenuLabel>
            <DropdownMenuSeparator style={{ backgroundColor: "var(--vscode-separator-color)" }} />
            <DropdownMenuItem
              onClick={() => onEditModeChange("auto")}
              className="text-[12px]"
              style={{ backgroundColor: editMode === "auto" ? "var(--vscode-toolbar-hover-background)" : undefined }}
            >
              <div>
                <p className="font-medium">Automatically</p>
                <p className="text-[10px] opacity-50">Apply edits without asking</p>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onEditModeChange("ask")}
              className="text-[12px]"
              style={{ backgroundColor: editMode === "ask" ? "var(--vscode-toolbar-hover-background)" : undefined }}
            >
              <div>
                <p className="font-medium">Ask</p>
                <p className="text-[10px] opacity-50">Confirm each edit</p>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Separator */}
        <span className="mx-0.5 h-3 w-px" style={{ backgroundColor: "var(--vscode-separator-color)" }} />

        {/* Plan mode toggle */}
        <button
          type="button"
          onClick={() => onPlanModeChange(!planMode)}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors theme-hover-bg",
          )}
          style={{
            color: planMode ? "var(--vscode-focus-border, #007fd4)" : "var(--vscode-editor-foreground)",
            opacity: planMode ? 1 : 0.55,
          }}
        >
          Plan
          {planMode && (
            <span
              className="rounded px-1 py-px text-[9px] font-bold"
              style={{ backgroundColor: "var(--vscode-focus-border, #007fd4)", color: "#fff" }}
            >
              ON
            </span>
          )}
        </button>
      </div>

      {/* Right cluster */}
      <ContextBar used={contextUsed} max={contextMax} />
    </div>
  );
}
