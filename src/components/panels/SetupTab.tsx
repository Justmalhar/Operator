import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, RotateCcw } from "lucide-react";
import * as api from "@/lib/tauri";

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error";
  text: string;
}

const DEFAULT_SCRIPT = `bun install
cp .env.example .env
bun run db:migrate
bun run build:css`;

export function SetupTab() {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [running, setRunning] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function runSetup() {
    if (running || !script.trim()) return;
    setRunning(true);
    setHasRun(true);

    // Show each command line immediately
    const scriptLines = script
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    setLines(
      scriptLines.map((cmd) => ({
        id: crypto.randomUUID(),
        type: "command" as const,
        text: cmd,
      })),
    );

    try {
      const result = await api.runShellScript(script);
      const out: TerminalLine[] = [];

      if (result.stdout) {
        for (const line of result.stdout.split("\n")) {
          out.push({ id: crypto.randomUUID(), type: "output", text: line });
        }
      }
      if (result.stderr) {
        for (const line of result.stderr.split("\n")) {
          out.push({ id: crypto.randomUUID(), type: "error", text: line });
        }
      }

      setLines((prev) => [...prev, ...out]);
    } catch (err) {
      setLines((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: String(err) },
      ]);
    }

    setRunning(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Script editor */}
      <div className="flex shrink-0 flex-col gap-2 px-3 py-3">
        <p
          className="text-[11px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          Setup script
        </p>

        <textarea
          className="w-full resize-none rounded font-mono text-[11px] focus:outline-none"
          style={{
            color: "#4ec994",
            backgroundColor: "rgba(0,0,0,0.25)",
            border: "1px solid var(--vscode-panel-border)",
            padding: "8px 10px",
            lineHeight: "1.7",
            minHeight: "76px",
          }}
          value={script}
          onChange={(e) => setScript(e.target.value)}
          spellCheck={false}
          rows={4}
        />

        <div className="flex justify-end">
          <motion.button
            type="button"
            onClick={runSetup}
            disabled={running || !script.trim()}
            whileHover={!running ? { scale: 1.02 } : {}}
            whileTap={!running ? { scale: 0.97 } : {}}
            className="flex items-center gap-1.5 rounded px-3 py-1.5 text-[11px] font-medium transition-colors duration-75"
            style={{
              backgroundColor: running
                ? "rgba(255,255,255,0.04)"
                : "rgba(78,201,148,0.1)",
              color: running
                ? "var(--vscode-tab-inactive-foreground)"
                : "#4ec994",
              border: "1px solid",
              borderColor: running
                ? "var(--vscode-panel-border)"
                : "rgba(78,201,148,0.3)",
              cursor: running ? "not-allowed" : "pointer",
            }}
          >
            {running ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <RotateCcw className="h-3 w-3" />
              </motion.div>
            ) : hasRun ? (
              <RotateCcw className="h-3 w-3" />
            ) : (
              <Play className="h-3 w-3" />
            )}
            <span>
              {running ? "Running..." : hasRun ? "Rerun setup" : "Run setup"}
            </span>
          </motion.button>
        </div>
      </div>

      {/* Terminal output */}
      <AnimatePresence>
        {lines.length > 0 && (
          <motion.div
            key="terminal-output"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-0 flex-1 overflow-hidden"
            style={{
              borderTop: "1px solid var(--vscode-panel-border)",
              backgroundColor: "rgba(0,0,0,0.2)",
            }}
          >
            <div
              className="vscode-scrollable h-full overflow-y-auto px-3 py-3 text-[11px]"
              style={{
                fontFamily:
                  "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace",
              }}
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="leading-[1.7]"
                  style={{
                    whiteSpace: "pre-wrap",
                    color:
                      line.type === "command"
                        ? "var(--vscode-editor-foreground)"
                        : line.type === "error"
                          ? "#f48771"
                          : "var(--vscode-tab-inactive-foreground)",
                  }}
                >
                  {line.type === "command" ? (
                    <span>
                      <span style={{ color: "#4ec994" }}>$ </span>
                      {line.text}
                    </span>
                  ) : (
                    line.text || "\u00A0"
                  )}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
