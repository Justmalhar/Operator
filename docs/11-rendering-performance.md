# Operator — Rendering Performance

*Version 1.0 · March 2026*

---

## 1. Performance Philosophy

Operator is permanently open during development sessions. Every millisecond of latency is felt over hours of use. The goal is not "fast enough" — it's **imperceptible**.

Key insight: most of Operator's rendering load comes from two places:
1. **PTY output streaming** — agents can print thousands of lines per second
2. **Diff rendering** — large changesets with 10k+ lines must open instantly

Everything else (sidebar, chat, settings) is standard React rendering — fast by default.

---

## 2. Terminal Rendering (xterm.js)

### 2.1 WebGL Renderer

```typescript
// Always load WebGL addon first — falls back to canvas if unavailable
const webglAddon = new WebglAddon();
try {
  terminal.loadAddon(webglAddon);
} catch (e) {
  // WebGL unavailable — canvas renderer is automatic fallback
  console.warn('WebGL renderer not available:', e);
}
```

WebGL renders each terminal cell as a GPU-accelerated quad. At 60fps, 10,000 cells render in ~2ms vs ~20ms for canvas. This is the single biggest performance win for terminal-heavy usage.

### 2.2 Scrollback Buffer Management

```typescript
const terminal = new Terminal({
  scrollback: 10_000,     // max lines in memory
  fastScrollModifier: 'alt',  // Alt+scroll for 5x speed
  fastScrollSensitivity: 5,
  // Do NOT set rows/cols — let FitAddon manage
});
```

With 10,000 lines of scrollback at ~100 bytes/line, each terminal uses ~1 MB of memory for history. At 10 parallel workspaces: 10 MB. Acceptable.

For very long-running agents (>10k lines), xterm.js automatically evicts oldest lines — no manual management needed.

### 2.3 PTY Stream Backpressure

Agents can output faster than xterm.js renders. Solution: batch writes.

```typescript
// src/hooks/useAgentStream.ts
let buffer = '';
let rafId: number | null = null;

function flushBuffer() {
  if (buffer) {
    terminal.write(buffer);
    buffer = '';
  }
  rafId = null;
}

listen<AgentOutputPayload>('agent_output', ({ payload }) => {
  if (payload.workspaceId !== workspaceId) return;
  buffer += payload.chunk;

  if (!rafId) {
    rafId = requestAnimationFrame(flushBuffer);
  }
});
```

This batches all PTY chunks received within a single animation frame into one `terminal.write()` call. At 60fps, writes happen at most 60 times/second regardless of agent output speed.

### 2.4 Terminal Resize Performance

```typescript
// Use ResizeObserver with debounce — resize events fire rapidly during panel drag
const debouncedResize = useMemo(
  () => debounce(() => {
    fitAddon.fit();
    invoke('resize_terminal', {
      terminalId,
      cols: terminal.cols,
      rows: terminal.rows,
    });
  }, 50),  // 50ms debounce
  []
);
```

---

## 3. Diff Viewer Performance

### 3.1 CodeMirror's collapseUnchanged

The single most important diff performance setting:

```typescript
new MergeView({
  // ...
  collapseUnchanged: {
    margin: 3,     // lines of context around each change
    minSize: 4,    // minimum unchanged block size to collapse
  },
});
```

This collapses unchanged regions and virtualizes them. A 10,000-line file with 50 changed lines renders nearly as fast as a 100-line file — only the changed sections and their context are in the DOM.

### 3.2 Language Extension Lazy Loading

Load language packs only when needed — don't bundle all 15 languages upfront:

```typescript
// Language extensions are loaded dynamically
const languageExtensions = new Map<string, () => Promise<Extension>>();

languageExtensions.set('ts', () => import('@codemirror/lang-typescript').then(m => m.typescript()));
languageExtensions.set('py', () => import('@codemirror/lang-python').then(m => m.python()));
languageExtensions.set('rs', () => import('@codemirror/lang-rust').then(m => m.rust()));
// ... etc

export async function getLanguageExtension(filePath: string): Promise<Extension> {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const loader = languageExtensions.get(ext);
  return loader ? loader() : Promise.resolve([]);
}
```

First render of a `.ts` file loads the TypeScript extension (~50ms). Subsequent files of the same type use the cached extension.

### 3.3 Diff Generation Performance

For large repositories, diff generation in Rust is fast (libgit2 is C under the hood). But serializing a full diff over Tauri IPC can be slow for huge patches.

Solution: paginated diff delivery.

```rust
#[tauri::command]
pub async fn get_diff_paginated(
    workspace_id: String,
    page: usize,
    page_size: usize,  // default: 100 files per page
) -> Result<DiffPage, OperatorError> {
    // ...
}

pub struct DiffPage {
    pub files: Vec<FileDiff>,
    pub total_files: usize,
    pub page: usize,
    pub has_more: bool,
}
```

The diff viewer renders the first 100 files immediately, then lazily loads more as the user scrolls the file tree.

---

## 4. File Tree Performance

### 4.1 react-arborist Virtualization

react-arborist uses windowing by default — only visible nodes are in the DOM. For a 10,000-file repo:

```typescript
<Tree
  data={fileTreeData}
  rowHeight={26}           // fixed row height required for virtualization
  overscanCount={8}        // extra rows rendered above/below viewport
  // react-arborist handles DOM recycling automatically
/>
```

Memory usage: ~100 bytes per node × 10,000 nodes = ~1 MB. Render time: ~5ms regardless of tree size.

### 4.2 File Index Updates

The file index is updated via `notify` (Rust file watcher) → debounced to avoid thrashing during agent writes:

```rust
// Debounce file change events by 500ms before emitting to React
let debounced_emit = tokio::time::sleep(Duration::from_millis(500));
```

This prevents the file tree from flickering while an agent is rapidly writing files.

---

## 5. Message List Performance

### 5.1 @tanstack/react-virtual

Chat messages can accumulate into the hundreds over a session. Virtualize the list:

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

export function MessageList({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      // Estimate height based on content length
      const msg = messages[index];
      return Math.max(60, Math.ceil(msg.content.length / 100) * 24);
    },
    overscan: 5,
  });

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length]);

  return (
    <div ref={parentRef} className="overflow-auto h-full">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(item => (
          <div
            key={item.key}
            style={{
              position: 'absolute',
              top: item.start,
              width: '100%',
            }}
          >
            <Message message={messages[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 5.2 Streaming Message Rendering

While an agent is typing, the last message updates frequently. Avoid re-rendering the entire list:

```typescript
// Separate the streaming message from the historical list
export function ChatPanel({ workspaceId }: ChatPanelProps) {
  const historicalMessages = useHistoricalMessages(workspaceId);
  const streamingMessage = useStreamingMessage(workspaceId);

  return (
    <div>
      {/* Historical messages — memoized, stable */}
      <MessageList messages={historicalMessages} />
      {/* Streaming message — updates on every PTY chunk */}
      {streamingMessage && (
        <StreamingMessage content={streamingMessage.content} />
      )}
    </div>
  );
}

// StreamingMessage re-renders on every chunk; MessageList does not
const MessageList = React.memo(({ messages }) => { ... });
```

---

## 6. Workspace Switching Performance

Switching between workspaces should feel instant (< 50ms).

Approach: **keep all workspaces mounted, display: none** for inactive ones.

```typescript
// WorkspacePane is always mounted — never unmounted on tab switch
// Only visibility changes (no re-render, no re-mount)
function WorkspaceContainer({ workspaceId, isActive }) {
  return (
    <div style={{ display: isActive ? 'flex' : 'none' }}>
      <WorkspacePane workspaceId={workspaceId} />
    </div>
  );
}
```

This means:
- xterm.js instances are never re-initialized on switch
- Chat scroll position is preserved
- PTY output continues streaming to hidden terminals

Memory implication: 10 workspaces × ~50 MB each = ~500 MB. Acceptable for power users.

For users with > 10 workspaces, implement LRU eviction: unmount the oldest inactive workspace that hasn't been viewed in 30 minutes.

---

## 7. IPC Performance

Tauri IPC serializes via JSON. For large payloads (diffs, file contents), this can add 10–50ms of overhead.

Optimizations:
1. **Stream large diffs** — paginate instead of one huge JSON response
2. **Binary IPC for PTY** — xterm.js terminal output uses `string` (UTF-8), not JSON arrays
3. **Debounce rapid events** — diff_updated and workspace_status_changed are debounced in Rust before emitting
4. **Avoid blocking Tauri commands** — all commands are `async fn`, never block the main thread

---

## 8. Memory Management

### 8.1 Per-Workspace Memory Budget

| Component | Memory |
|---|---|
| xterm.js instance (10k scrollback) | ~8 MB |
| React component tree | ~2 MB |
| Message history (1000 messages) | ~5 MB |
| File index (10k files) | ~1 MB |
| CodeMirror diff instance | ~3 MB |
| **Total per workspace** | **~19 MB** |

With 5 workspaces: ~95 MB React-side. Plus Rust backend and WebView overhead: ~175 MB total. Within target.

### 8.2 Cleanup on Workspace Archive

When a workspace is archived:
1. Unmount the React component tree
2. Call `terminal.dispose()` on the xterm.js instance
3. Remove from virtualizer list
4. Zustand store: move from `active` to `archived` (lightweight stub only)
5. Rust: kill PTY process, close file watchers

---

## 9. Cold Start Performance

Target: < 400ms from app launch to interactive UI.

Optimizations:
- **Lazy load heavy components:** DiffViewer, SkillPanel, HooksConfigurator — load on first access
- **Vite code splitting:** Each major panel is a separate chunk
- **SQLite WAL mode:** First DB query doesn't block
- **No synchronous IPC on startup:** Sidebar data loaded async, empty state shown immediately
- **Native webview:** No Chromium initialization overhead

Startup sequence:
```
0ms    App shell opens
50ms   React hydrates (empty sidebar)
100ms  SQLite query: load repos + workspaces
150ms  Sidebar renders with workspace list
200ms  Active workspace pane renders (chat history from DB)
300ms  File index loaded (async, non-blocking)
<400ms App fully interactive
```
