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
    <div className={cn("flex h-full min-h-0 flex-col bg-[#1e1e1e]", className)}>
      <div className="border-b border-white/8 bg-[#181818]">
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
                    "group flex h-9 min-w-[180px] max-w-[260px] items-center gap-2 border-r border-white/8 px-3 text-sm transition-colors",
                    isActive ? "bg-[#1e1e1e] text-white" : "bg-[#2d2d2d] text-[#c5c5c5] hover:bg-[#323233]",
                  )}
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    type="button"
                    onClick={() => onTabSelect(tab.id)}
                  >
                    <Icon className="size-4 shrink-0 text-[#8b8b8b]" />
                    <span className="truncate">{tab.filename}</span>
                    {tab.dirty ? <span className="text-[#4fc1ff]">*</span> : null}
                  </button>
                  <button
                    className={cn(
                      "rounded p-0.5 text-[#8b8b8b] transition-colors hover:bg-black/20 hover:text-white",
                      !isActive ? "opacity-0 group-hover:opacity-100" : "",
                    )}
                    type="button"
                    onClick={() => onTabClose(tab.id)}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <div className="min-h-0 flex-1">
        {activeTab ? (
          <FileViewer filePath={activeTab.filePath} filename={activeTab.filename} />
        ) : (
          emptyState ?? (
            <div className="flex h-full items-center justify-center text-sm text-[#8b8b8b]">
              Open a file from the explorer to preview it here.
            </div>
          )
        )}
      </div>
    </div>
  );
}
