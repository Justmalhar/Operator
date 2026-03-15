import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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

interface SetupTabProps {
  /** Increment to trigger a fresh run */
  runTrigger?: number;
  /** Increment to clear output and rerun (reinstall) */
  rerunTrigger?: number;
  onRunningChange?: (running: boolean) => void;
}

export function SetupTab({ runTrigger = 0, rerunTrigger = 0, onRunningChange }: SetupTabProps) {
  const [script, setScript] = useState(DEFAULT_SCRIPT);
  const [running, setRunning] = useState(false);
  const [lines, setLines] = useState<TerminalLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const runningRef = useRef(false);

  async function runSetup(clearFirst = false) {
    if (runningRef.current || !script.trim()) return;
    runningRef.current = true;
    setRunning(true);
    onRunningChange?.(true);
    if (clearFirst) setLines([]);

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

    runningRef.current = false;
    setRunning(false);
    onRunningChange?.(false);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  }

  // Fire when header play button increments runTrigger
  useEffect(() => {
    if (runTrigger > 0) runSetup(false);
  }, [runTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fire when header reinstall button increments rerunTrigger
  useEffect(() => {
    if (rerunTrigger > 0) runSetup(true);
  }, [rerunTrigger]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col">
      {/* Script editor only — run button lives in the section header */}
      <div className="flex flex-col gap-2 px-3 py-3">
        <p
          className="text-[11px]"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          Setup script
        </p>

        <textarea
          className="w-full resize-none rounded font-mono text-[11px] focus:outline-none"
          style={{
            color: "var(--vscode-terminal-ansi-green, #4ec994)",
            backgroundColor: "var(--vscode-terminal-background, var(--vscode-editor-background))",
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
      </div>

      {/* Terminal output */}
      <AnimatePresence>
        {lines.length > 0 && (
          <motion.div
            key="terminal-output"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="overflow-hidden"
            style={{
              borderTop: "1px solid var(--vscode-panel-border)",
              backgroundColor: "var(--vscode-terminal-background, var(--vscode-editor-background))",
            }}
          >
            <div
              className="vscode-scrollable overflow-y-auto px-3 py-3 text-[11px]"
              style={{ maxHeight: "200px", fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace" }}
            >
              {lines.map((line) => (
                <div
                  key={line.id}
                  className="leading-[1.7]"
                  style={{
                    whiteSpace: "pre-wrap",
                    color:
                      line.type === "command"
                        ? "var(--vscode-terminal-foreground, var(--vscode-editor-foreground))"
                        : line.type === "error"
                          ? "var(--vscode-terminal-ansi-red, #f48771)"
                          : "var(--vscode-tab-inactive-foreground)",
                  }}
                >
                  {line.type === "command" ? (
                    <span>
                      <span style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }}>$ </span>
                      {line.text}
                    </span>
                  ) : (
                    line.text || "\u00A0"
                  )}
                </div>
              ))}
              {running && (
                <motion.div
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block h-[13px] w-[7px] align-middle"
                  style={{ backgroundColor: "var(--vscode-terminal-foreground, var(--vscode-editor-foreground))" }}
                />
              )}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
