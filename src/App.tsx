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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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

function App() {
  const [tabs, setTabs] = useState<WorkspaceFileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [filePath, setFilePath] = useState("");
  const [filename, setFilename] = useState("");

  const explorerSections = useMemo(() => {
    return seededEntries.reduce<Record<string, ExplorerEntry[]>>((groups, entry) => {
      groups[entry.section] ??= [];
      groups[entry.section].push(entry);
      return groups;
    }, {});
  }, []);

  function openTab(nextTab: WorkspaceFileTab) {
    setTabs((currentTabs) => {
      const existingTab = currentTabs.find((tab) => tab.id === nextTab.id || tab.filePath === nextTab.filePath);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        return currentTabs;
      }

      return [...currentTabs, nextTab];
    });
    setActiveTabId(nextTab.id);
  }

  function handleFileOpen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!filePath.trim() || !filename.trim()) {
      return;
    }

    openTab({
      id: `${filename}-${filePath}`,
      filePath: filePath.trim(),
      filename: filename.trim(),
    });
  }

  function closeTab(tabId: string) {
    setTabs((currentTabs) => {
      const nextTabs = currentTabs.filter((tab) => tab.id !== tabId);

      if (activeTabId === tabId) {
        setActiveTabId(nextTabs[nextTabs.length - 1]?.id ?? null);
      }

      return nextTabs;
    });
  }

  return (
    <main className="flex h-screen bg-[#111111] text-[#f3f3f3]">
      <aside className="flex w-[300px] flex-col border-r border-white/8 bg-[linear-gradient(180deg,#181818_0%,#121212_100%)]">
        <div className="border-b border-white/8 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-[#8b8b8b]">Operator</p>
          <h1 className="mt-2 text-xl font-semibold text-white">Viewer Workbench</h1>
          <p className="mt-2 text-sm leading-6 text-[#9d9d9d]">
            The docs drove the implementation: dark-first viewer surfaces, VS Code-like file tabs,
            CodeMirror-backed text rendering, and heavier previews lazy-loaded only when opened.
          </p>
        </div>

        <form className="border-b border-white/8 px-5 py-4" onSubmit={handleFileOpen}>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[#8b8b8b]">Open Local File</p>
          <div className="space-y-3">
            <Input
              className="border-white/10 bg-white/5 text-sm text-white placeholder:text-[#6f6f6f]"
              placeholder="/absolute/path/to/file.pdf"
              value={filePath}
              onChange={(event) => setFilePath(event.currentTarget.value)}
            />
            <Input
              className="border-white/10 bg-white/5 text-sm text-white placeholder:text-[#6f6f6f]"
              placeholder="filename.pdf"
              value={filename}
              onChange={(event) => setFilename(event.currentTarget.value)}
            />
            <Button className="w-full bg-[#0e639c] text-white hover:bg-[#1177bb]" type="submit">
              Open In Tab
            </Button>
          </div>
        </form>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          {Object.entries(explorerSections).map(([section, entries]) => (
            <section key={section} className="mb-6">
              <p className="mb-2 px-2 text-[11px] uppercase tracking-[0.18em] text-[#6f6f6f]">{section}</p>
              <div className="space-y-1">
                {entries.map((entry) => (
                  <button
                    key={entry.id}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/6",
                      activeTabId === entry.id ? "bg-white/8 text-white" : "text-[#c5c5c5]",
                    )}
                    type="button"
                    onClick={() =>
                      openTab({
                        id: entry.id,
                        filePath: entry.filePath,
                        filename: entry.filename,
                      })
                    }
                  >
                    <span className="truncate">{entry.filename}</span>
                    <span className="text-[11px] uppercase tracking-[0.08em] text-[#6f6f6f]">open</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/8 bg-[#181818] px-5 py-3">
          <div>
            <p className="text-sm font-medium text-white">Open Files</p>
            <p className="text-xs text-[#8b8b8b]">
              Supported viewers: code, markdown, image, csv, xlsx, pdf, docx, pptx, html
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-[#8b8b8b]">
            Close parity target: VS Code workbench tabs
          </div>
        </header>
        <div className="min-h-0 flex-1">
          <WorkspacePane
            activeTabId={activeTabId}
            tabs={tabs}
            onTabClose={closeTab}
            onTabSelect={setActiveTabId}
            emptyState={
              <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-sm text-[#8b8b8b]">
                Open a file from the left explorer or paste a filesystem path above.
              </div>
            }
          />
        </div>
      </section>
    </main>
  );
}

export default App;
