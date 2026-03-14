import type { ReactNode } from "react";
import { FileCode2, FileImage, FileSpreadsheet, FileText, Globe, Presentation, Table2, X } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { FileViewer } from "@/components/viewers/FileViewer";
import { getViewerKind } from "@/components/viewers/viewer-utils";

export interface WorkspaceFileTab {
  id: string;
  filePath: string;
  filename: string;
  dirty?: boolean;
}

export interface WorkspaceTabsProps {
  tabs: WorkspaceFileTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  emptyState?: ReactNode;
  className?: string;
}

const tabIcons = {
  binary: FileText,
  code: FileCode2,
  csv: Table2,
  docx: FileText,
  image: FileImage,
  markdown: FileText,
  pdf: FileText,
  ppt: Presentation,
  web: Globe,
  xlsx: FileSpreadsheet,
} as const;

export function WorkspaceTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  emptyState,
  className,
}: WorkspaceTabsProps) {
  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0] ?? null;

  return (
    <div className={cn("vscode-editor flex h-full min-h-0 flex-col", className)}>
      {/* Tab bar */}
      {tabs.length > 0 && (
        <div className="vscode-tab-bar shrink-0 overflow-hidden">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex min-w-full items-stretch">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTab?.id;
                const kind = getViewerKind(tab.filename);
                const Icon = tabIcons[kind];

                return (
                  <div
                    key={tab.id}
                    className={cn(
                      "vscode-tab group flex h-[35px] min-w-[140px] max-w-[220px] items-center gap-1.5 px-3 text-[13px] transition-colors duration-75",
                      isActive && "active",
                    )}
                  >
                    <button
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      type="button"
                      onClick={() => onTabSelect(tab.id)}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: isActive ? "var(--vscode-tab-active-foreground)" : "var(--vscode-tab-inactive-foreground)", opacity: 0.7 }} />
                      <span className="truncate">{tab.filename}</span>
                      {tab.dirty && <span style={{ color: "var(--vscode-focus-border)" }}>●</span>}
                    </button>
                    <button
                      className={cn(
                        "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded transition-all duration-75",
                        !isActive && "opacity-0 group-hover:opacity-100",
                      )}
                      style={{ color: "var(--vscode-tab-inactive-foreground)" }}
                      type="button"
                      aria-label="Close tab"
                      onClick={() => onTabClose(tab.id)}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Content */}
      <div className="min-h-0 flex-1">
        {activeTab ? (
          <FileViewer filePath={activeTab.filePath} filename={activeTab.filename} />
        ) : (
          emptyState ?? (
            <div className="flex h-full items-center justify-center text-[13px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
              Open a file from the explorer to preview it here.
            </div>
          )
        )}
      </div>
    </div>
  );
}
