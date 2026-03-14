import { FormEvent, useMemo, useState } from "react";
import reactSvg from "./assets/react.svg";
import "./App.css";
import "highlight.js/styles/github-dark.css";
import systemDesignDoc from "../docs/01-system-design.md?raw";
import uiLayoutDoc from "../docs/02-ui-layout-screens.md?raw";
import componentDesignDoc from "../docs/03-component-design.md?raw";
import apiDesignDoc from "../docs/05-api-design.md?raw";
import indexHtmlSource from "../index.html?raw";
import { WorkspacePane } from "@/components/workspace/WorkspacePane";
import type { WorkspaceFileTab } from "@/components/workspace/WorkspaceTabs";
import { TodosPanel } from "@/components/todos/TodosPanel";
import { cn } from "@/lib/utils";
import { SidebarLayout } from "@/components/layout/SidebarLayout";
import { NewChatPage } from "@/components/chat/NewChatPage";
import { RightPanel } from "@/components/panels/RightPanel";
import { BottomPanel } from "@/components/panels/BottomPanel";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { ChevronRight, FileCode2, FileImage, FileText, Globe, Table2, PanelRight, PanelBottom } from "lucide-react";

interface ExplorerEntry {
  id: string;
  filename: string;
  filePath: string;
  section: string;
}

function makeBlobFilePath(content: string, type: string) {
  return URL.createObjectURL(new Blob([content], { type }));
}

const seededEntries: ExplorerEntry[] = [
  {
    id: "system-design",
    filename: "01-system-design.md",
    filePath: makeBlobFilePath(systemDesignDoc, "text/markdown"),
    section: "docs",
  },
  {
    id: "ui-layout",
    filename: "02-ui-layout-screens.md",
    filePath: makeBlobFilePath(uiLayoutDoc, "text/markdown"),
    section: "docs",
  },
  {
    id: "component-design",
    filename: "03-component-design.md",
    filePath: makeBlobFilePath(componentDesignDoc, "text/markdown"),
    section: "docs",
  },
  {
    id: "api-design",
    filename: "05-api-design.md",
    filePath: makeBlobFilePath(apiDesignDoc, "text/markdown"),
    section: "docs",
  },
  {
    id: "index-html",
    filename: "index.html",
    filePath: makeBlobFilePath(indexHtmlSource, "text/html"),
    section: "preview",
  },
  {
    id: "react-svg",
    filename: "react.svg",
    filePath: reactSvg,
    section: "preview",
  },
  {
    id: "sample-csv",
    filename: "system-matrix.csv",
    filePath: makeBlobFilePath(
      "area,status,target\nfile-viewers,in-progress,vs-code-tabs\ndiff-viewer,built,mergeview\npdf-renderer,built,pdfjs",
      "text/csv",
    ),
    section: "preview",
  },
];

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "md": return FileText;
    case "html": return Globe;
    case "svg":
    case "png":
    case "jpg": return FileImage;
    case "csv": return Table2;
    default: return FileCode2;
  }
}

function App() {
  const [tabs, setTabs] = useState<WorkspaceFileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [filePath, setFilePath] = useState("");
  const [filename, setFilename] = useState("");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>("ws-los-angeles");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ docs: true, preview: true });
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);

  const explorerSections = useMemo(() => {
    return seededEntries.reduce<Record<string, ExplorerEntry[]>>((groups, entry) => {
      groups[entry.section] ??= [];
      groups[entry.section].push(entry);
      return groups;
    }, {});
  }, []);

  function openTab(nextTab: WorkspaceFileTab) {
    setTabs((current) => {
      const existing = current.find(
        (t) => t.id === nextTab.id || t.filePath === nextTab.filePath,
      );
      if (existing) {
        setActiveTabId(existing.id);
        return current;
      }
      return [...current, nextTab];
    });
    setActiveTabId(nextTab.id);
  }

  function handleFileOpen(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!filePath.trim() || !filename.trim()) return;
    openTab({ id: `${filename}-${filePath}`, filePath: filePath.trim(), filename: filename.trim() });
    setFilePath("");
    setFilename("");
  }

  function closeTab(tabId: string) {
    setTabs((current) => {
      const next = current.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) setActiveTabId(next[next.length - 1]?.id ?? null);
      return next;
    });
  }

  function toggleSection(section: string) {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ backgroundColor: "var(--vscode-editor-background)" }}>
      {/* ── Title bar ─────────────────────────────────────────────────── */}
      <div className="vscode-titlebar flex shrink-0 items-center" data-tauri-drag-region>
        {/* Traffic light spacing on macOS */}
        <div className="w-[78px] shrink-0" />
        <div className="flex min-w-0 flex-1 items-center justify-center">
          <span className="text-[12px] font-medium" style={{ color: "var(--vscode-titlebar-foreground)", opacity: 0.8 }}>
            Operator
          </span>
        </div>
        <div className="flex items-center gap-1 pr-2">
          <button
            type="button"
            onClick={() => setShowRightPanel((v) => !v)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded transition-colors duration-75",
              showRightPanel ? "opacity-100" : "opacity-40",
            )}
            style={{ color: "var(--vscode-titlebar-foreground)" }}
            aria-label="Toggle right panel"
            title="Toggle right panel"
          >
            <PanelRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setShowBottomPanel((v) => !v)}
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded transition-colors duration-75",
              showBottomPanel ? "opacity-100" : "opacity-40",
            )}
            style={{ color: "var(--vscode-titlebar-foreground)" }}
            aria-label="Toggle bottom panel"
            title="Toggle bottom panel"
          >
            <PanelBottom className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <div className="flex min-h-0 flex-1">
        {/* 1. Primary sidebar: workspaces */}
        <SidebarLayout
          activeWorkspaceId={activeWorkspaceId}
          onWorkspaceSelect={setActiveWorkspaceId}
        />

        {/* 2. Explorer panel */}
        <aside className="vscode-sidebar vscode-scrollable flex w-[220px] shrink-0 flex-col overflow-y-auto">
          {/* Panel title */}
          <div className="vscode-sidebar-section-header flex shrink-0 items-center px-4" style={{ height: "35px" }}>
            <span className="vscode-sidebar-title">Explorer</span>
          </div>

          {/* Open file form */}
          <div className="shrink-0 px-3 py-2.5" style={{ borderBottom: "1px solid var(--vscode-sidebar-section-header-border)" }}>
            <form className="flex flex-col gap-1.5" onSubmit={handleFileOpen}>
              <input
                className="vscode-input vscode-focusable w-full rounded px-2 py-1 text-[12px]"
                placeholder="File path..."
                value={filePath}
                onChange={(e) => setFilePath(e.currentTarget.value)}
              />
              <input
                className="vscode-input vscode-focusable w-full rounded px-2 py-1 text-[12px]"
                placeholder="Filename..."
                value={filename}
                onChange={(e) => setFilename(e.currentTarget.value)}
              />
              <button
                type="submit"
                className="vscode-button vscode-focusable w-full rounded py-1 text-[12px] font-medium"
              >
                Open in Tab
              </button>
            </form>
          </div>

          {/* File sections */}
          {Object.entries(explorerSections).map(([section, entries]) => (
            <div key={section}>
              <button
                type="button"
                onClick={() => toggleSection(section)}
                className="vscode-sidebar-section-header flex w-full items-center gap-1 px-3 text-left"
                style={{ height: "22px" }}
              >
                <ChevronRight
                  className={cn("h-3 w-3 shrink-0 transition-transform duration-150", expandedSections[section] && "rotate-90")}
                  style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
                />
                <span className="vscode-sidebar-title">{section}</span>
              </button>
              {expandedSections[section] && (
                <div className="py-0.5">
                  {entries.map((entry) => {
                    const Icon = getFileIcon(entry.filename);
                    return (
                      <button
                        key={entry.id}
                        type="button"
                        className={cn(
                          "vscode-list-item vscode-focusable flex w-full items-center gap-2 px-4 py-[3px] text-left text-[13px] transition-colors duration-75",
                          activeTabId === entry.id && "selected",
                        )}
                        onClick={() => openTab({ id: entry.id, filePath: entry.filePath, filename: entry.filename })}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--vscode-list-tree-indent-guide-stroke)" }} />
                        <span className="min-w-0 flex-1 truncate">{entry.filename}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </aside>

        {/* 3. Todos panel */}
        <aside className="vscode-sidebar flex w-[200px] shrink-0 flex-col">
          <TodosPanel />
        </aside>

        {/* 4. Main content: chat + editor + right panel */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top area: chat + editor + right panel */}
          <div className="flex min-h-0 flex-1">
            {/* Chat panel */}
            {activeWorkspaceId && (
              <div
                className="flex w-[320px] shrink-0 flex-col"
                style={{ borderRight: "1px solid var(--vscode-sidebar-section-header-border)" }}
              >
                <ChatPanel workspaceId={activeWorkspaceId} />
              </div>
            )}

            {/* Editor area */}
            <div className="vscode-editor flex min-w-0 flex-1 flex-col">
              <WorkspacePane
                activeTabId={activeTabId}
                tabs={tabs}
                onTabClose={closeTab}
                onTabSelect={setActiveTabId}
                emptyState={<NewChatPage />}
              />
            </div>

            {/* Right panel */}
            {showRightPanel && (
              <div className="w-[260px] shrink-0">
                <RightPanel />
              </div>
            )}
          </div>

          {/* Bottom panel */}
          {showBottomPanel && (
            <div className="h-[200px] shrink-0">
              <BottomPanel />
            </div>
          )}
        </div>
      </div>

      {/* ── Status bar ────────────────────────────────────────────────── */}
      <div className="vscode-statusbar flex h-[22px] shrink-0 items-center justify-between px-2.5 text-[11px]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ backgroundColor: "#0dbc79" }} />
            Ready
          </span>
          {activeWorkspaceId && (
            <span style={{ opacity: 0.8 }}>Los Angeles</span>
          )}
        </div>
        <div className="flex items-center gap-3" style={{ opacity: 0.8 }}>
          <span>Operator v0.1.0</span>
        </div>
      </div>
    </div>
  );
}

export default App;
