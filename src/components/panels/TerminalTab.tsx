import { useEffect, useRef, useState } from "react";

interface TerminalLine {
  id: string;
  type: "command" | "output" | "error" | "vite" | "url";
  text: string;
}

const INITIAL_LINES: TerminalLine[] = [
  { id: "1", type: "command", text: "bun run dev; exit" },
  { id: "2", type: "output", text: "(eval):2: command not found: compdef" },
  { id: "3", type: "output", text: "(eval):213: command not found: compdef" },
  { id: "4", type: "output", text: "" },
  { id: "5", type: "command", text: "> bun run dev; exit" },
  { id: "6", type: "output", text: "$ vite" },
  { id: "7", type: "output", text: "" },
  { id: "8", type: "vite", text: "  VITE v7.3.1  ready in 1632 ms" },
  { id: "9", type: "output", text: "" },
  { id: "10", type: "url", text: "  ➜  Local:   http://localhost:1420/" },
  { id: "11", type: "output", text: "  ➜  press h + enter to show help" },
  { id: "12", type: "output", text: "" },
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

  function getLineColor(type: TerminalLine["type"]): string {
    switch (type) {
      case "command": return "var(--vscode-editor-foreground)";
      case "error": return "#f48771";
      case "vite": return "#e8ab53";
      case "url": return "#3b9edd";
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
        {lines.map((line) => (
          <div
            key={line.id}
            className="leading-[1.8]"
            style={{
              color: getLineColor(line.type),
              whiteSpace: "pre-wrap",
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
        className="flex shrink-0 items-center gap-1.5 px-4 py-2"
        style={{ borderTop: "1px solid var(--vscode-sidebar-section-header-border, rgba(255,255,255,0.06))" }}
      >
        <span className="font-bold" style={{ color: "#4ec994" }}>$</span>
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
        />
      </form>
    </div>
  );
}
