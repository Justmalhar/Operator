import { useEffect, useRef, useState } from "react";

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error";
  text: string;
}

const INITIAL_LINES: TerminalLine[] = [
  { id: "1", type: "output", text: "Operator terminal  —  Los Angeles workspace" },
  { id: "2", type: "output", text: "" },
  { id: "3", type: "command", text: "$ bun run dev" },
  { id: "4", type: "output", text: "  vite v5.4.2 ready in 312 ms" },
  { id: "5", type: "output", text: "" },
  { id: "6", type: "output", text: "  ➜  Local:   http://localhost:5173/" },
  { id: "7", type: "output", text: "  ➜  Network: use --host to expose" },
  { id: "8", type: "output", text: "" },
];

export function TerminalTab() {
  const [lines, setLines] = useState<TerminalLine[]>(INITIAL_LINES);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const cmd = input.trim();
    if (!cmd) return;

    const newLines: TerminalLine[] = [
      { id: crypto.randomUUID(), type: "command", text: `$ ${cmd}` },
    ];

    // Simple mock responses
    if (cmd === "ls") {
      newLines.push({ id: crypto.randomUUID(), type: "output", text: "CLAUDE.md  src/  assets/  package.json" });
    } else if (cmd === "clear") {
      setLines([]);
      setInput("");
      setHistory((h) => [cmd, ...h]);
      setHistoryIdx(-1);
      return;
    } else if (cmd.startsWith("echo ")) {
      newLines.push({ id: crypto.randomUUID(), type: "output", text: cmd.slice(5) });
    } else {
      newLines.push({ id: crypto.randomUUID(), type: "error", text: `command not found: ${cmd}` });
    }

    newLines.push({ id: crypto.randomUUID(), type: "output", text: "" });
    setLines((prev) => [...prev, ...newLines]);
    setHistory((h) => [cmd, ...h]);
    setHistoryIdx(-1);
    setInput("");
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

  return (
    <div
      className="flex h-full flex-col font-mono text-[12px]"
      style={{ backgroundColor: "var(--vscode-editor-background)" }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {lines.map((line) => (
          <div
            key={line.id}
            style={{
              color:
                line.type === "command"
                  ? "var(--vscode-sidebar-foreground)"
                  : line.type === "error"
                    ? "#f48771"
                    : "var(--vscode-tab-inactive-foreground)",
              whiteSpace: "pre-wrap",
              lineHeight: "1.5",
            }}
          >
            {line.text || "\u00A0"}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="flex shrink-0 items-center gap-1 px-3 py-1.5"
        style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border)" }}
      >
        <span style={{ color: "#4ec994" }}>$</span>
        <input
          ref={inputRef}
          className="min-w-0 flex-1 bg-transparent text-[12px] focus:outline-none"
          style={{ color: "var(--vscode-sidebar-foreground)", fontFamily: "inherit" }}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoComplete="off"
          autoFocus
        />
      </form>
    </div>
  );
}
