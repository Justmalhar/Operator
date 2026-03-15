/**
 * WebBrowserViewer — native WKWebView browser panel.
 *
 * A Tauri WebviewWindow (decoration-less, parent="main") is positioned to
 * overlay the React panel's content area, giving a fully native WKWebKit view
 * that can load any URL (github.com, google.com, localhost:3000, local HTML).
 *
 * Coordinate math:
 *   - Tauri's Window.innerPosition() returns the PhysicalPosition of the
 *     content-area top-left corner (below the native title bar).
 *   - Dividing by scaleFactor() converts to logical pixels.
 *   - Adding getBoundingClientRect() offsets (which are in CSS/logical px)
 *     gives the correct logical screen position for the child window.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Globe, RotateCw, X } from "lucide-react";
import { invoke, isTauri, convertFileSrc } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalPosition, LogicalSize } from "@tauri-apps/api/dpi";
import { cn } from "@/lib/utils";
import { type BaseViewerProps } from "./viewer-utils";

// ── helpers ───────────────────────────────────────────────────────────────────

function toLoadUrl(filePath: string): string {
  if (
    filePath.startsWith("http://") ||
    filePath.startsWith("https://") ||
    filePath.startsWith("blob:") ||
    filePath.startsWith("data:")
  ) {
    return filePath;
  }
  return isTauri() ? convertFileSrc(filePath) : filePath;
}

function normalizeInput(raw: string): string {
  const s = raw.trim();
  if (!s) return s;
  if (
    s.startsWith("http://") ||
    s.startsWith("https://") ||
    s.startsWith("asset://") ||
    s.startsWith("https://asset.localhost") ||
    s.startsWith("blob:") ||
    s.startsWith("data:")
  ) return s;
  return `https://${s}`;
}

/** Get screen-logical rect for an element using Tauri's Window APIs. */
async function getLogicalScreenRect(el: HTMLElement) {
  const win = getCurrentWindow();
  const [inner, scale] = await Promise.all([win.innerPosition(), win.scaleFactor()]);
  const rect = el.getBoundingClientRect();
  return {
    x: Math.round(inner.x / scale + rect.left),
    y: Math.round(inner.y / scale + rect.top),
    width: Math.max(Math.round(rect.width), 100),
    height: Math.max(Math.round(rect.height), 100),
  };
}

let labelIdx = 0;
function nextLabel() { labelIdx += 1; return `wbv-${labelIdx}`; }

// ── component ─────────────────────────────────────────────────────────────────

export function WebBrowserViewer({ filePath, filename, className }: BaseViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wvRef = useRef<WebviewWindow | null>(null);
  const labelRef = useRef(nextLabel());

  const [currentUrl, setCurrentUrl] = useState(() => toLoadUrl(filePath));
  const [inputUrl, setInputUrl] = useState(() => toLoadUrl(filePath));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = toLoadUrl(filePath);
    setCurrentUrl(u);
    setInputUrl(u);
  }, [filePath]);

  // ── create WebviewWindow on mount ─────────────────────────────────────────
  useEffect(() => {
    if (!isTauri() || !containerRef.current) return;
    const label = labelRef.current;
    const container = containerRef.current;

    let cancelled = false;

    getLogicalScreenRect(container).then((sr) => {
      if (cancelled) return;

      const wv = new WebviewWindow(label, {
        url: currentUrl,
        x: sr.x,
        y: sr.y,
        width: sr.width,
        height: sr.height,
        decorations: false,
        transparent: false,
        resizable: false,
        alwaysOnTop: false,
        skipTaskbar: true,
        shadow: false,
        title: filename,
        parent: "main",
      });

      wv.once("tauri://created", () => { if (!cancelled) setLoading(false); });
      wv.once("tauri://error", () => { if (!cancelled) setLoading(false); });
      wvRef.current = wv;
    });

    return () => {
      cancelled = true;
      const lbl = labelRef.current;
      // Move off-screen immediately so the native window vanishes visually
      // without waiting for the async close IPC round-trip.
      if (wvRef.current) {
        void wvRef.current.setPosition(new LogicalPosition(-99999, -99999));
      }
      wvRef.current = null;
      // Close via Rust — more reliable than WebviewWindow.close() from JS,
      // which uses a self-close permission that doesn't apply cross-window.
      void invoke("close_webview", { label: lbl });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── navigate when URL changes (after initial creation) ────────────────────
  const initialRender = useRef(true);
  useEffect(() => {
    if (initialRender.current) { initialRender.current = false; return; }
    if (!wvRef.current) return;
    setLoading(true);
    void invoke("navigate_webview", { label: labelRef.current, url: currentUrl });
  }, [currentUrl]);

  // ── sync position/size on layout changes ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || !isTauri()) return;
    const container = containerRef.current;

    async function syncGeometry() {
      if (!wvRef.current) return;
      const sr = await getLogicalScreenRect(container);
      void wvRef.current.setPosition(new LogicalPosition(sr.x, sr.y));
      void wvRef.current.setSize(new LogicalSize(sr.width, sr.height));
    }

    const ro = new ResizeObserver(() => { void syncGeometry(); });
    ro.observe(container);
    window.addEventListener("resize", () => { void syncGeometry(); });
    window.addEventListener("scroll", () => { void syncGeometry(); }, true);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", () => { void syncGeometry(); });
      window.removeEventListener("scroll", () => { void syncGeometry(); }, true);
    };
  }, []);

  // ── toolbar actions ───────────────────────────────────────────────────────
  const navigate = useCallback((url: string) => {
    const n = normalizeInput(url);
    if (!n) return;
    setCurrentUrl(n);
    setInputUrl(n);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") navigate(inputUrl);
      if (e.key === "Escape") setInputUrl(currentUrl);
    },
    [inputUrl, currentUrl, navigate],
  );

  const handleReload = useCallback(() => {
    setLoading(true);
    void invoke("navigate_webview", { label: labelRef.current, url: currentUrl });
  }, [currentUrl]);

  const handleBack = useCallback(() => {
    void invoke("navigate_webview", { label: labelRef.current, url: "javascript:history.back()" });
  }, []);

  const handleForward = useCallback(() => {
    void invoke("navigate_webview", { label: labelRef.current, url: "javascript:history.forward()" });
  }, []);

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col", className)}
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
    >
      {/* Toolbar */}
      <div
        className="flex shrink-0 items-center gap-2 px-3 py-2"
        style={{
          backgroundColor: "var(--vscode-tab-active-background, var(--vscode-editor-background))",
          borderBottom: "1px solid var(--vscode-panel-border)",
        }}
      >
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={handleBack}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-75 hover:bg-white/10"
            style={{ color: "var(--vscode-descriptionForeground)" }}
            title="Back"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleForward}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-75 hover:bg-white/10"
            style={{ color: "var(--vscode-descriptionForeground)" }}
            title="Forward"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleReload}
            className="flex h-6 w-6 items-center justify-center rounded transition-colors duration-75 hover:bg-white/10"
            style={{ color: "var(--vscode-descriptionForeground)" }}
            title="Reload"
          >
            <RotateCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          </button>
        </div>

        <div
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-2.5 py-1"
          style={{
            backgroundColor: "var(--vscode-input-background)",
            border: "1px solid var(--vscode-input-border, var(--vscode-panel-border))",
          }}
        >
          <Globe
            className="h-3 w-3 shrink-0 opacity-60"
            style={{ color: "var(--vscode-descriptionForeground)" }}
          />
          <input
            type="text"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={(e) => e.currentTarget.select()}
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent text-xs outline-none"
            style={{
              color: "var(--vscode-input-foreground)",
              fontFamily: "'SF Mono', Menlo, Monaco, monospace",
            }}
            placeholder="github.com or localhost:3000…"
          />
          {inputUrl && (
            <button
              type="button"
              onClick={() => setInputUrl("")}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded opacity-60 hover:opacity-100"
              style={{ color: "var(--vscode-descriptionForeground)" }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <span
          className="hidden max-w-[100px] shrink-0 truncate text-xs opacity-60 sm:block"
          style={{ color: "var(--vscode-descriptionForeground)" }}
          title={filename}
        >
          {filename}
        </span>
      </div>

      {/* Loading placeholder */}
      {loading && (
        <div
          className="flex flex-1 items-center justify-center gap-2 text-xs"
          style={{ color: "var(--vscode-descriptionForeground)" }}
        >
          <RotateCw className="h-3.5 w-3.5 animate-spin" />
          Loading…
        </div>
      )}

      {/* Position anchor — the native WebviewWindow is overlaid here */}
      <div
        ref={containerRef}
        className={cn("min-h-0 flex-1", loading && "invisible")}
      />
    </div>
  );
}
