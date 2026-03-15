import { FileCode2, Folder } from "lucide-react";

export interface FileSuggestion {
  id: string;
  name: string;
  path: string;
  type: "file" | "folder";
}

const DEMO_FILES: FileSuggestion[] = [
  { id: "1", name: "App.tsx", path: "src/App.tsx", type: "file" },
  { id: "2", name: "Composer.tsx", path: "src/components/composer/Composer.tsx", type: "file" },
  { id: "3", name: "ChatPanel.tsx", path: "src/components/chat/ChatPanel.tsx", type: "file" },
  { id: "4", name: "components/", path: "src/components", type: "folder" },
  { id: "5", name: "lib/utils.ts", path: "src/lib/utils.ts", type: "file" },
];

interface FileMentionOverlayProps {
  query: string;
  onSelect: (file: FileSuggestion) => void;
  visible: boolean;
  activeIndex: number;
}

export function FileMentionOverlay({ query, onSelect, visible, activeIndex }: FileMentionOverlayProps) {
  if (!visible) return null;

  const filtered = query
    ? DEMO_FILES.filter(
        (f) =>
          f.name.toLowerCase().includes(query.toLowerCase()) ||
          f.path.toLowerCase().includes(query.toLowerCase()),
      )
    : DEMO_FILES;

  if (filtered.length === 0) return null;

  return (
    <div
      className="absolute bottom-full left-0 mb-1 w-72 overflow-hidden rounded-md shadow-xl"
      style={{
        backgroundColor: "var(--vscode-dropdown-background, #252526)",
        border: "1px solid var(--vscode-dropdown-border, rgba(255,255,255,0.1))",
        zIndex: 50,
      }}
    >
      <div
        className="px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--vscode-editor-foreground)", opacity: 0.4 }}
      >
        Files
      </div>
      {filtered.slice(0, 8).map((f, i) => (
        <button
          key={f.id}
          type="button"
          onClick={() => onSelect(f)}
          className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors theme-hover-bg"
          style={{
            color: "var(--vscode-editor-foreground)",
            backgroundColor: i === activeIndex ? "var(--vscode-toolbar-hover-background)" : undefined,
          }}
        >
          {f.type === "folder" ? (
            <Folder className="h-3.5 w-3.5 shrink-0 opacity-50" />
          ) : (
            <FileCode2 className="h-3.5 w-3.5 shrink-0 opacity-50" />
          )}
          <span className="min-w-0 flex-1 truncate">{f.name}</span>
          <span className="shrink-0 truncate text-[10px] opacity-40">{f.path}</span>
        </button>
      ))}
    </div>
  );
}
