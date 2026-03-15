import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import * as api from "@/lib/tauri";

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error";
  text: string;
}

interface TerminalTabProps {
  worktreePath?: string;
}

export function TerminalTab({ worktreePath }: TerminalTabProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: "welcome", type: "output", text: worktreePath ? `Operator Terminal — ${worktreePath}` : "Operator Terminal" },
    { id: "blank", type: "output", text: "" },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    const newLines: TerminalLine[] = [
      { id: crypto.randomUUID(), type: "command", text: `$ ${cmd}` },
    ];

    if (cmd === "clear") {
      setLines([]);
      setInput("");
      setHistory((h) => [cmd, ...h]);
      setHistoryIdx(-1);
      return;
    }

    setLines((prev) => [...prev, ...newLines]);
    setInput("");
    setHistory((h) => [cmd, ...h]);
    setHistoryIdx(-1);
    setRunning(true);

    try {
      const result = await api.runShellCommand(cmd, worktreePath);
      const outputLines: TerminalLine[] = [];

      if (result.stdout) {
        for (const line of result.stdout.split("\n")) {
          outputLines.push({ id: crypto.randomUUID(), type: "output", text: line });
        }
      }
      if (result.stderr) {
        for (const line of result.stderr.split("\n")) {
          outputLines.push({ id: crypto.randomUUID(), type: "error", text: line });
        }
      }
      if (outputLines.length === 0) {
        outputLines.push({ id: crypto.randomUUID(), type: "output", text: "" });
      }

      setLines((prev) => [...prev, ...outputLines]);
    } catch (err) {
      setLines((prev) => [
        ...prev,
        { id: crypto.randomUUID(), type: "error", text: String(err) },
        { id: crypto.randomUUID(), type: "output", text: "" },
      ]);
    }

    setRunning(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      const nextIdx = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx] ?? "");
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(nextIdx);
      setInput(nextIdx === -1 ? "" : (history[nextIdx] ?? ""));
    }
  }

  function getLineColor(type: TerminalLine["type"]): string {
    switch (type) {
      case "command": return "var(--vscode-editor-foreground)";
      case "error": return "#f48771";
      default: return "var(--vscode-tab-inactive-foreground)";
    }
  }

  return (
    <div
      className="vscode-panel flex h-full flex-col text-[12px]"
      style={{ fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <AnimatePresence>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.1 }}
              className="leading-[1.8]"
              style={{
                color: getLineColor(line.type),
                whiteSpace: "pre-wrap",
              }}
            >
              {line.type === "command" ? (
                <span>
                  <span style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }}>$</span>
                  <span>{line.text.slice(1)}</span>
                </span>
              ) : (
                line.text || "\u00A0"
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-1.5 px-4 py-2"
        style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.06))" }}
      >
        <motion.span
          animate={{ color: running ? "#cca700" : "#4ec994" }}
          transition={{ duration: 0.15 }}
          className="font-bold"
        >
          {running ? (
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            >
              ...
            </motion.span>
          ) : (
            "$"
          )}
        </motion.span>
        <input
          ref={inputRef}
          className="min-w-0 flex-1 bg-transparent text-[12px] focus:outline-none"
          style={{ color: "var(--vscode-editor-foreground)", fontFamily: "inherit" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoFocus
          disabled={running}
          placeholder={running ? "Running..." : "Enter command..."}
        />
      </form>
    </div>
  );
}
