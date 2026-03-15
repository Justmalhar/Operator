import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  FileCode2,
  FileImage,
  FileSpreadsheet,
  FileText,
  Globe,
  MessageSquare,
  Plus,
  Presentation,
  Table2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { NewChatPage } from "@/components/chat/NewChatPage";
import { FileViewer } from "@/components/viewers/FileViewer";
import { getViewerKind, type ViewerKind } from "@/components/viewers/viewer-utils";
import { WorkspaceHeader } from "./WorkspaceHeader";
import { tabContent, springs } from "@/lib/animations";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabType = "chat" | "new-chat" | "file";

interface CenterTab {
  id: string;
  type: TabType;
  label: string;
  workspaceId?: string;
  filename?: string;
  filePath?: string;
}

export interface CenterPanelHandle {
  openFile(filename: string, filePath: string): void;
  openNewChat(): void;
}

// ── Icon map ──────────────────────────────────────────────────────────────────

const viewerIconMap: Record<ViewerKind, LucideIcon> = {
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
};

function getTabIcon(tab: CenterTab): LucideIcon {
  if (tab.type === "chat") return MessageSquare;
  if (tab.type === "new-chat") return Plus;
  const kind = tab.filename ? getViewerKind(tab.filename) : "code";
  return viewerIconMap[kind] ?? FileCode2;
}

// ── Initial tab factory ───────────────────────────────────────────────────────

function makeInitialTabs(workspaceId: string | null): CenterTab[] {
  if (workspaceId) {
    return [{ id: `chat-${workspaceId}`, type: "chat", label: "Chat", workspaceId }];
  }
  return [{ id: "new-chat-initial", type: "new-chat", label: "New Chat" }];
}

// ── CenterPanel ───────────────────────────────────────────────────────────────

interface CenterPanelProps {
  workspaceId: string | null;
  showRightPanel?: boolean;
  onToggleRightPanel?: () => void;
}

export const CenterPanel = forwardRef<CenterPanelHandle, CenterPanelProps>(
  function CenterPanel({ workspaceId, showRightPanel, onToggleRightPanel }, ref) {
    const [tabs, setTabs] = useState<CenterTab[]>(() => makeInitialTabs(workspaceId));
    const [activeTabId, setActiveTabId] = useState<string>(
      () => makeInitialTabs(workspaceId)[0].id,
    );

    const prevWorkspaceIdRef = useRef<string | null | undefined>(undefined);
    useEffect(() => {
      if (prevWorkspaceIdRef.current === undefined) {
        prevWorkspaceIdRef.current = workspaceId;
        return;
      }
      if (prevWorkspaceIdRef.current === workspaceId) return;
      prevWorkspaceIdRef.current = workspaceId;
      const initial = makeInitialTabs(workspaceId);
      setTabs(initial);
      setActiveTabId(initial[0].id);
    }, [workspaceId]);

    useImperativeHandle(ref, () => ({
      openFile(filename: string, filePath: string) {
        const id = `file-${filePath}`;
        setTabs((prev) => {
          if (prev.find((t) => t.id === id)) {
            setActiveTabId(id);
            return prev;
          }
          setActiveTabId(id);
          return [
            ...prev,
            { id, type: "file", label: filename, filename, filePath },
          ];
        });
      },
      openNewChat() {
        const id = `new-chat-${Date.now()}`;
        setTabs((prev) => [...prev, { id, type: "new-chat", label: "New Chat" }]);
        setActiveTabId(id);
      },
    }));

    function closeTab(tabId: string, e: React.MouseEvent) {
      e.stopPropagation();
      setTabs((prev) => {
        if (prev.length <= 1) return prev;
        const idx = prev.findIndex((t) => t.id === tabId);
        const next = prev.filter((t) => t.id !== tabId);
        if (tabId === activeTabId) {
          const neighborIdx = Math.max(0, idx - 1);
          setActiveTabId(next[neighborIdx]?.id ?? next[0].id);
        }
        return next;
      });
    }

    function openNewChatTab() {
      const id = `new-chat-${Date.now()}`;
      setTabs((prev) => [...prev, { id, type: "new-chat", label: "New Chat" }]);
      setActiveTabId(id);
    }

    const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];

    return (
      <div className="vscode-editor flex h-full flex-col overflow-hidden">
        {/* Workspace header row */}
        <WorkspaceHeader workspaceId={workspaceId} showRightPanel={showRightPanel} onToggleRightPanel={onToggleRightPanel} />

        {/* Tab bar */}
        <div
          className="vscode-tab-bar shrink-0 overflow-hidden"
          style={{ height: "35px" }}
        >
          <ScrollArea className="h-full w-full whitespace-nowrap">
            <div className="flex h-[35px] min-w-full items-stretch">
              <AnimatePresence mode="popLayout">
                {tabs.map((tab) => {
                  const Icon = getTabIcon(tab);
                  const isActive = tab.id === activeTab?.id;
                  return (
                    <motion.div
                      key={tab.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9, width: 0 }}
                      animate={{ opacity: 1, scale: 1, width: "auto" }}
                      exit={{ opacity: 0, scale: 0.9, width: 0 }}
                      transition={springs.snappy}
                      className={cn(
                        "vscode-tab group relative flex h-full min-w-[100px] max-w-[180px] cursor-pointer items-center gap-1.5 px-3 text-[12px]",
                        isActive && "active",
                      )}
                      onClick={() => setActiveTabId(tab.id)}
                      role="tab"
                      aria-selected={isActive}
                    >
                      <Icon
                        className="h-3.5 w-3.5 shrink-0"
                        style={{
                          color: isActive
                            ? "var(--vscode-tab-active-foreground)"
                            : "var(--vscode-tab-inactive-foreground)",
                          opacity: isActive ? 0.8 : 0.5,
                        }}
                      />
                      <span className="min-w-0 flex-1 truncate">{tab.label}</span>
                      {tabs.length > 1 && (
                        <motion.button
                          type="button"
                          aria-label={`Close ${tab.label}`}
                          onClick={(e) => closeTab(tab.id, e)}
                          whileHover={{ backgroundColor: "rgba(255,255,255,0.1)", scale: 1.1 }}
                          whileTap={{ scale: 0.8 }}
                          className={cn(
                            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded",
                            !isActive && "opacity-0 group-hover:opacity-100",
                          )}
                          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
                        >
                          <X className="h-3 w-3" />
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* New tab button */}
              <motion.button
                type="button"
                onClick={openNewChatTab}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.05)", scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex h-full w-[32px] shrink-0 items-center justify-center"
                style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.5 }}
                title="New Chat"
                aria-label="Open new chat tab"
              >
                <Plus className="h-3.5 w-3.5" />
              </motion.button>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>

        {/* Tab content with animated transitions */}
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab?.id}
              variants={tabContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="h-full"
            >
              {activeTab?.type === "chat" && (
                <ChatPanel workspaceId={activeTab.workspaceId} />
              )}
              {activeTab?.type === "new-chat" && <NewChatPage />}
              {activeTab?.type === "file" &&
                activeTab.filename &&
                activeTab.filePath && (
                  <FileViewer
                    filename={activeTab.filename}
                    filePath={activeTab.filePath}
                  />
                )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  },
);
