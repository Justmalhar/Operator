# Operator — React Packages & Components

*Version 1.0 · March 2026*

---

## 1. Complete Package List

### package.json (production dependencies)

```json
{
  "dependencies": {
    "@tauri-apps/api": "^2.x",
    "@tauri-apps/plugin-store": "^2.x",
    "@tauri-apps/plugin-dialog": "^2.x",
    "@tauri-apps/plugin-notification": "^2.x",
    "@tauri-apps/plugin-updater": "^2.x",

    "react": "^19.0.0",
    "react-dom": "^19.0.0",

    "@xterm/xterm": "^5.x",
    "@xterm/addon-fit": "^0.10.x",
    "@xterm/addon-web-links": "^0.11.x",
    "@xterm/addon-search": "^0.15.x",
    "@xterm/addon-webgl": "^0.18.x",
    "@xterm/addon-unicode11": "^0.8.x",

    "@codemirror/view": "^6.x",
    "@codemirror/state": "^6.x",
    "@codemirror/commands": "^6.x",
    "@codemirror/search": "^6.x",
    "@codemirror/lang-javascript": "^6.x",
    "@codemirror/lang-typescript": "^6.x",
    "@codemirror/lang-python": "^6.x",
    "@codemirror/lang-rust": "^6.x",
    "@codemirror/lang-css": "^6.x",
    "@codemirror/lang-html": "^6.x",
    "@codemirror/lang-json": "^6.x",
    "@codemirror/lang-markdown": "^6.x",
    "@codemirror/lang-php": "^6.x",
    "@codemirror/lang-sql": "^6.x",
    "@codemirror/lang-java": "^6.x",
    "@codemirror/lang-go": "^6.x",
    "@codemirror/merge": "^6.x",
    "@codemirror/theme-one-dark": "^6.x",

    "react-arborist": "^3.x",
    "fuse.js": "^7.x",
    "cmdk": "^1.x",
    "react-resizable-panels": "^2.x",
    "framer-motion": "^11.x",
    "zustand": "^4.x",
    "immer": "^10.x",
    "@tanstack/react-virtual": "^3.x",

    "react-markdown": "^9.x",
    "remark-gfm": "^4.x",
    "rehype-highlight": "^7.x",

    "posthog-js": "^1.x",

    "date-fns": "^3.x",
    "clsx": "^2.x",
    "tailwind-merge": "^2.x"
  },
  "devDependencies": {
    "@types/react": "^19.x",
    "@types/react-dom": "^19.x",
    "typescript": "^5.x",
    "vite": "^6.x",
    "@vitejs/plugin-react": "^4.x",
    "tailwindcss": "^4.x",
    "@tailwindcss/vite": "^4.x",
    "vitest": "^2.x",
    "@testing-library/react": "^16.x",
    "@testing-library/user-event": "^14.x"
  }
}
```

---

## 2. Terminal: @xterm/xterm

### 2.1 Setup

```typescript
// src/components/terminal/TerminalTab.tsx
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebglAddon } from '@xterm/addon-webgl';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';

export function useTerminal(workspaceId: string) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const terminal = new Terminal({
      theme: {
        background: '#0d0d0d',
        foreground: '#e8e8e8',
        cursor: '#4d9fff',
        selectionBackground: 'rgba(77, 159, 255, 0.3)',
        black: '#1a1a1a',
        red: '#f04444',
        green: '#3ccc74',
        yellow: '#f59e0b',
        blue: '#4d9fff',
        magenta: '#a78bfa',
        cyan: '#22d3ee',
        white: '#e8e8e8',
      },
      fontFamily: '"Cascadia Code", "Fira Code", monospace',
      fontSize: 13,
      lineHeight: 1.4,
      cursorBlink: true,
      scrollback: 10000,
      convertEol: true,
    });

    const fitAddon = new FitAddon();
    const webglAddon = new WebglAddon();
    const searchAddon = new SearchAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(searchAddon);
    terminal.loadAddon(webLinksAddon);

    try {
      terminal.loadAddon(webglAddon);  // fallback to canvas if WebGL unavailable
    } catch {
      console.warn('WebGL not available, falling back to canvas renderer');
    }

    terminal.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;

    // Listen for PTY output from Rust
    const unlisten = listen<{ workspaceId: string; chunk: string }>(
      'agent_output',
      ({ payload }) => {
        if (payload.workspaceId === workspaceId) {
          terminal.write(payload.chunk);
        }
      }
    );

    // Send user input to PTY
    terminal.onData((data) => {
      invoke('write_terminal', {
        workspaceId,
        data,
      });
    });

    // Handle resize
    const observer = new ResizeObserver(() => {
      fitAddon.fit();
      invoke('resize_terminal', {
        workspaceId,
        cols: terminal.cols,
        rows: terminal.rows,
      });
    });
    observer.observe(terminalRef.current);

    return () => {
      unlisten.then(fn => fn());
      observer.disconnect();
      webglAddon.dispose();
      terminal.dispose();
    };
  }, [workspaceId]);

  return { terminalRef, searchAddon: searchAddonRef };
}
```

---

## 3. Diff Viewer: @codemirror/merge

### 3.1 Setup

```typescript
// src/components/diff/DiffViewer.tsx
import { EditorView } from '@codemirror/view';
import { MergeView } from '@codemirror/merge';
import { getLanguageExtension } from './languageDetect';

interface DiffViewerProps {
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  onComment?: (fromLine: number, toLine: number) => void;
}

export function DiffViewer({ filePath, originalContent, modifiedContent }: DiffViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mergeViewRef = useRef<MergeView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const langExtension = getLanguageExtension(filePath);

    const mergeView = new MergeView({
      parent: containerRef.current,
      a: {
        doc: originalContent,
        extensions: [
          EditorView.editable.of(false),
          langExtension,
          operatorDarkTheme,
          EditorView.lineWrapping,
          lineNumbers(),
        ],
      },
      b: {
        doc: modifiedContent,
        extensions: [
          EditorView.editable.of(false),
          langExtension,
          operatorDarkTheme,
          EditorView.lineWrapping,
          lineNumbers(),
        ],
      },
      orientation: 'a-b',
      highlightChanges: true,
      gutter: true,
      collapseUnchanged: { margin: 3, minSize: 4 },
    });

    mergeViewRef.current = mergeView;

    return () => mergeView.destroy();
  }, [filePath, originalContent, modifiedContent]);

  return <div ref={containerRef} className="h-full overflow-auto" />;
}

// Language detection
function getLanguageExtension(filePath: string) {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const map: Record<string, () => Extension> = {
    'ts': () => typescript(),
    'tsx': () => typescript({ jsx: true }),
    'js': () => javascript(),
    'jsx': () => javascript({ jsx: true }),
    'py': () => python(),
    'rs': () => rust(),
    'css': () => css(),
    'html': () => html(),
    'json': () => json(),
    'md': () => markdown(),
    'php': () => php(),
    'sql': () => sql(),
  };
  return map[ext ?? '']?.() ?? [];
}
```

---

## 4. File Tree: react-arborist

### 4.1 Setup

```typescript
// src/components/filetree/FileTree.tsx
import { Tree, NodeRendererProps } from 'react-arborist';
import type { FileTreeNode } from '@/types';

interface FileTreeProps {
  data: FileTreeNode[];
  changedFiles: Set<string>;
  onFileClick: (path: string) => void;
}

function FileNode({ node, style, dragHandle }: NodeRendererProps<FileTreeNode>) {
  const isChanged = useChangedFiles().has(node.data.path);

  return (
    <div
      ref={dragHandle}
      style={style}
      className={cn(
        'flex items-center gap-1.5 py-0.5 px-2 rounded text-sm cursor-pointer',
        'hover:bg-white/5',
        node.isSelected && 'bg-white/10',
      )}
      onClick={() => node.isLeaf ? onFileClick(node.data.path) : node.toggle()}
    >
      {!node.isLeaf && (
        <span className="text-zinc-500 text-xs">{node.isOpen ? '▾' : '▸'}</span>
      )}
      {node.isLeaf && (
        <span className="w-4 text-xs">
          {getFileIcon(node.data.name)}
        </span>
      )}
      <span className={cn(
        isChanged ? 'text-amber-400' : 'text-zinc-300',
        node.data.isUntracked && 'text-zinc-500',
      )}>
        {node.data.name}
      </span>
      {isChanged && (
        <span className="ml-auto text-xs text-amber-500">M</span>
      )}
    </div>
  );
}

export function FileTree({ data, changedFiles, onFileClick }: FileTreeProps) {
  return (
    <Tree
      data={data}
      width="100%"
      height={600}
      indent={16}
      rowHeight={26}
      overscanCount={8}
      renderNode={(props) => (
        <FileNode {...props} onFileClick={onFileClick} changedFiles={changedFiles} />
      )}
    />
  );
}
```

---

## 5. Command Palette: cmdk

### 5.1 Setup

```typescript
// src/components/command-palette/CommandPalette.tsx
import { Command } from 'cmdk';
import Fuse from 'fuse.js';

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCommand, setSelectedCommand] = useState<Command | null>(null);

  const commands = useCommandStore(s => s.commands);

  const fuse = useMemo(() => new Fuse(commands, {
    keys: ['name', 'description', 'category'],
    threshold: 0.3,
    includeScore: true,
  }), [commands]);

  const filtered = search
    ? fuse.search(search).map(r => r.item)
    : commands.filter(c => selectedCategory === 'all' || c.category === selectedCategory);

  const handleSelect = useCallback((command: Command) => {
    onClose();
    if (command.acceptsArgs) {
      setArgInputOpen({ command });
      return;
    }
    dispatch(command);
  }, [onClose]);

  return (
    <Command.Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      label="Command palette"
      className="operator-command-palette"
    >
      <div className="flex">
        {/* Category sidebar */}
        <div className="w-40 border-r border-white/8 p-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={cn('w-full text-left px-2 py-1 rounded text-sm', selectedCategory === cat.id && 'bg-white/10')}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>

        {/* Command list */}
        <div className="flex-1">
          <Command.Input
            value={search}
            onValueChange={setSearch}
            placeholder="Search commands..."
          />
          <Command.List>
            <Command.Empty>No commands found.</Command.Empty>
            {filtered.map(cmd => (
              <Command.Item
                key={cmd.id}
                value={cmd.id}
                onSelect={() => handleSelect(cmd)}
              >
                <span className="font-mono text-blue-400">/{cmd.name}</span>
                <span className="text-zinc-400 text-xs ml-2">{cmd.description}</span>
                <span className="ml-auto">
                  <SourceBadge source={cmd.source} />
                </span>
              </Command.Item>
            ))}
          </Command.List>
        </div>

        {/* Preview pane */}
        {selectedCommand && (
          <div className="w-64 border-l border-white/8 p-3">
            <SkillMdPreview content={selectedCommand.skill?.skillMdContent} />
          </div>
        )}
      </div>
    </Command.Dialog>
  );
}
```

---

## 6. Resizable Layout: react-resizable-panels

### 6.1 Setup

```typescript
// src/layouts/WorkspaceLayout.tsx
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

export function WorkspaceLayout({ workspaceId }: { workspaceId: string }) {
  return (
    <PanelGroup direction="horizontal" autoSaveId="workspace-layout">
      {/* Left sidebar - fixed width, not resizable in this group */}
      <Sidebar />

      <PanelGroup direction="horizontal">
        {/* Main chat area */}
        <Panel defaultSize={55} minSize={30}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={75} minSize={40}>
              <ChatPanel workspaceId={workspaceId} />
            </Panel>

            <PanelResizeHandle className="h-1 bg-transparent hover:bg-white/10 transition-colors" />

            <Panel defaultSize={25} minSize={10} collapsible>
              <BottomPanel workspaceId={workspaceId} />
            </Panel>
          </PanelGroup>
        </Panel>

        <PanelResizeHandle className="w-1 bg-transparent hover:bg-white/10 transition-colors" />

        {/* Right panel */}
        <Panel defaultSize={45} minSize={20} collapsible>
          <RightPanel workspaceId={workspaceId} />
        </Panel>
      </PanelGroup>
    </PanelGroup>
  );
}
```

---

## 7. Fuzzy Search: fuse.js

### 7.1 File Mention Search

```typescript
// src/hooks/useFileMentionSearch.ts
import Fuse from 'fuse.js';

export function useFileMentionSearch(workspaceId: string) {
  const [query, setQuery] = useState('');
  const fileIndex = useWorkspaceFileIndex(workspaceId);

  const fuse = useMemo(() => new Fuse(fileIndex, {
    threshold: 0.3,
    distance: 100,
    includeScore: true,
    useExtendedSearch: false,
    minMatchCharLength: 1,
  }), [fileIndex]);

  const results = useMemo(() => {
    if (!query) return fileIndex.slice(0, 8);
    return fuse.search(query, { limit: 8 }).map(r => r.item);
  }, [query, fuse, fileIndex]);

  return { query, setQuery, results };
}
```

---

## 8. State Management: Zustand

### 8.1 Workspace Store

```typescript
// src/stores/workspaceStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

interface WorkspaceStore {
  workspaces: Record<string, Workspace>;
  activeWorkspaceId: string | null;
  setActiveWorkspace: (id: string) => void;
  updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
  addWorkspace: (workspace: Workspace) => void;
  removeWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  immer(
    persist(
      (set) => ({
        workspaces: {},
        activeWorkspaceId: null,

        setActiveWorkspace: (id) => set(state => {
          state.activeWorkspaceId = id;
        }),

        updateWorkspace: (id, updates) => set(state => {
          if (state.workspaces[id]) {
            Object.assign(state.workspaces[id], updates);
          }
        }),

        addWorkspace: (workspace) => set(state => {
          state.workspaces[workspace.id] = workspace;
        }),

        removeWorkspace: (id) => set(state => {
          delete state.workspaces[id];
          if (state.activeWorkspaceId === id) {
            state.activeWorkspaceId = null;
          }
        }),
      }),
      {
        name: 'operator-workspaces',
        partialize: (state) => ({ activeWorkspaceId: state.activeWorkspaceId }),
      }
    )
  )
);
```

---

## 9. Animations: framer-motion

Used sparingly — only for workspace card entrance, sidebar transitions, and overlay open/close.

```typescript
// Workspace card entrance
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -8 }}
  transition={{ duration: 0.15, ease: 'easeOut' }}
>
  <WorkspaceItem workspace={workspace} />
</motion.div>

// Command palette overlay
<AnimatePresence>
  {isOpen && (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.1 }}
    >
      <CommandPalette />
    </motion.div>
  )}
</AnimatePresence>
```

---

## 10. Markdown Rendering: react-markdown

Used for agent message content. Security: no raw HTML, only safe markdown elements.

```typescript
// src/components/chat/MarkdownContent.tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/atom-one-dark.css';

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeHighlight]}
      components={{
        // Custom code block with copy button
        code({ node, inline, className, children, ...props }) {
          const language = /language-(\w+)/.exec(className || '')?.[1];
          if (!inline) {
            return (
              <CodeBlock language={language} code={String(children)}>
                {children}
              </CodeBlock>
            );
          }
          return <code className={cn('bg-white/10 rounded px-1 text-sm font-mono', className)} {...props}>{children}</code>;
        },
        // File change badges rendered as custom components
        a({ href, children }) {
          return <a href={href} className="text-blue-400 hover:underline" target="_blank" rel="noopener">{children}</a>;
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

---

## 11. Tailwind Config

```typescript
// tailwind.config.ts
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          elevated: 'var(--bg-elevated)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          green: 'var(--accent-green)',
          amber: 'var(--accent-amber)',
          red: 'var(--accent-red)',
          purple: 'var(--accent-purple)',
        },
        border: 'var(--border)',
      },
      fontFamily: {
        mono: ['"Cascadia Code"', '"Fira Code"', '"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '10px',
        xl: '14px',
      },
    },
  },
  plugins: [],
} satisfies Config;
```
