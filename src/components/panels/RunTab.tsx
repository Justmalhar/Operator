import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Square, RotateCcw, Plus, Trash2 } from "lucide-react";
import { springs } from "@/lib/animations";

export interface RunScript {
  id: string;
  name: string;
  command: string;
  description?: string;
  port?: number;
}

export const DEFAULT_SCRIPTS: RunScript[] = [
  { id: "dev", name: "dev", command: "bun run dev", description: "Start development server", port: 5173 },
  { id: "build", name: "build", command: "bun run build", description: "Build for production" },
  { id: "css", name: "css:watch", command: "bun run build:css --watch", description: "Compile & watch CSS" },
  { id: "test", name: "test", command: "bun run test", description: "Run test suite" },
  { id: "lint", name: "lint", command: "bun run lint", description: "Run linter" },
];

interface TerminalLine {
  id: string;
  type: "command" | "output" | "info";
  text: string;
}

interface RunTabProps {
  runningScriptId: string | null;
  onRunningChange: (script: RunScript | null) => void;
}

export function RunTab({ runningScriptId, onRunningChange }: RunTabProps) {
  const [scripts, setScripts] = useState<RunScript[]>(DEFAULT_SCRIPTS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCommand, setEditCommand] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPort, setEditPort] = useState("");
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  const runningScript = scripts.find((s) => s.id === runningScriptId) ?? null;

  // When a script starts running, populate terminal output
  useEffect(() => {
    if (!runningScript) return;

    const startLines: TerminalLine[] = [
      { id: crypto.randomUUID(), type: "command", text: runningScript.command },
    ];

    // Add simulated startup output based on script type
    const outputLines: TerminalLine[] = [];
    if (runningScript.command.includes("dev") || runningScript.command.includes("run dev")) {
      outputLines.push(
        { id: crypto.randomUUID(), type: "output", text: "" },
        { id: crypto.randomUUID(), type: "info", text: "  VITE v5.4.0  ready in 312ms" },
        { id: crypto.randomUUID(), type: "output", text: "" },
        { id: crypto.randomUUID(), type: "info", text: `  ➜  Local:   http://localhost:${runningScript.port ?? 5173}/` },
        { id: crypto.randomUUID(), type: "info", text: "  ➜  Network: use --host to expose" },
        { id: crypto.randomUUID(), type: "output", text: "" },
      );
    } else if (runningScript.command.includes("build")) {
      outputLines.push(
        { id: crypto.randomUUID(), type: "output", text: "" },
        { id: crypto.randomUUID(), type: "info", text: "  Building..." },
      );
    } else if (runningScript.command.includes("test")) {
      outputLines.push(
        { id: crypto.randomUUID(), type: "output", text: "" },
        { id: crypto.randomUUID(), type: "info", text: "  Running test suite..." },
      );
    } else if (runningScript.command.includes("lint")) {
      outputLines.push(
        { id: crypto.randomUUID(), type: "output", text: "" },
        { id: crypto.randomUUID(), type: "info", text: "  Checking files..." },
      );
    } else if (runningScript.command.includes("watch")) {
      outputLines.push(
        { id: crypto.randomUUID(), type: "output", text: "" },
        { id: crypto.randomUUID(), type: "info", text: "  Watching for changes..." },
      );
    }

    setTerminalLines([...startLines, ...outputLines]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  }, [runningScriptId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Clear terminal when stopped
  useEffect(() => {
    if (!runningScriptId) {
      // Keep lines visible briefly after stop
      const timer = setTimeout(() => setTerminalLines([]), 600);
      return () => clearTimeout(timer);
    }
  }, [runningScriptId]);

  function toggle(script: RunScript) {
    if (runningScriptId === script.id) {
      onRunningChange(null);
    } else {
      onRunningChange(script);
    }
  }

  function startEdit(script: RunScript) {
    setEditingId(script.id);
    setEditName(script.name);
    setEditCommand(script.command);
    setEditDescription(script.description ?? "");
    setEditPort(script.port ? String(script.port) : "");
  }

  function saveEdit(id: string) {
    setScripts((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const updated: RunScript = {
          ...s,
          name: editName.trim() || s.name,
          command: editCommand.trim() || s.command,
          description: editDescription.trim() || s.description,
          port: editPort.trim() ? Number(editPort.trim()) : undefined,
        };
        if (runningScriptId === id) onRunningChange(updated);
        return updated;
      }),
    );
    setEditingId(null);
  }

  function addScript() {
    const id = `script-${Date.now()}`;
    const newScript: RunScript = { id, name: "new", command: "", description: "New script" };
    setScripts((prev) => [...prev, newScript]);
    setEditingId(id);
    setEditName("new");
    setEditCommand("");
    setEditDescription("New script");
    setEditPort("");
  }

  function deleteScript(id: string) {
    if (runningScriptId === id) onRunningChange(null);
    setScripts((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="flex flex-col">
      {/* Script list */}
      <div className="vscode-scrollable overflow-y-auto py-2">
        <AnimatePresence mode="popLayout">
          {scripts.map((script) => {
            const isRunning = runningScriptId === script.id;
            const isEditing = editingId === script.id;

            return (
              <motion.div
                key={script.id}
                layout
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={springs.snappy}
                className="group"
              >
                {isEditing ? (
                  <div
                    className="mx-3 my-1 flex flex-col gap-2 rounded p-2.5"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.04)",
                      border: "1px solid var(--vscode-panel-border)",
                    }}
                  >
                    <div className="flex gap-2">
                      <input
                        className="w-20 shrink-0 bg-transparent font-mono text-[11px] font-medium focus:outline-none"
                        style={{
                          color: "var(--vscode-sidebar-foreground)",
                          borderBottom: "1px solid var(--vscode-panel-border)",
                          paddingBottom: "2px",
                        }}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="name"
                        autoFocus
                      />
                      <input
                        className="min-w-0 flex-1 bg-transparent text-[11px] focus:outline-none"
                        style={{
                          color: "var(--vscode-tab-inactive-foreground)",
                          borderBottom: "1px solid var(--vscode-panel-border)",
                          paddingBottom: "2px",
                        }}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="description"
                      />
                    </div>
                    <input
                      className="w-full bg-transparent font-mono text-[11px] focus:outline-none"
                      style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }}
                      value={editCommand}
                      onChange={(e) => setEditCommand(e.target.value)}
                      placeholder="command to run..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(script.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
                        Port
                      </span>
                      <input
                        className="w-16 bg-transparent font-mono text-[11px] focus:outline-none"
                        style={{
                          color: "var(--vscode-tab-inactive-foreground)",
                          borderBottom: "1px solid var(--vscode-panel-border)",
                          paddingBottom: "2px",
                        }}
                        value={editPort}
                        onChange={(e) => setEditPort(e.target.value.replace(/\D/g, ""))}
                        placeholder="e.g. 3000"
                      />
                      <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-[11px] transition-opacity hover:opacity-70"
                        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(script.id)}
                        className="text-[11px] font-medium transition-opacity hover:opacity-70"
                        style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 px-4 py-2">
                    {/* Run/Stop toggle */}
                    <motion.button
                      type="button"
                      onClick={() => toggle(script)}
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.88 }}
                      className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded transition-all duration-75"
                      aria-label={isRunning ? "Stop" : "Run"}
                      title={isRunning ? "Stop" : "Run"}
                      style={isRunning ? {
                        backgroundColor: "rgba(244,135,113,0.12)",
                        border: "1px solid rgba(244,135,113,0.25)",
                      } : {
                        backgroundColor: "transparent",
                        border: "1px solid transparent",
                      }}
                    >
                      {isRunning ? (
                        <Square className="h-[10px] w-[10px]" fill="currentColor" style={{ color: "var(--vscode-errorForeground, #f48771)" }} />
                      ) : (
                        <Play className="h-[11px] w-[11px]" fill="currentColor" style={{ color: "var(--vscode-terminal-ansi-green, #4ec994)" }} />
                      )}
                    </motion.button>

                    {/* Script info (click to edit) */}
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => startEdit(script)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="font-mono text-[12px] font-medium"
                          style={{ color: "var(--vscode-sidebar-foreground)" }}
                        >
                          {script.name}
                        </span>
                        {script.port && (
                          <span
                            className="text-[10px]"
                            style={{ color: "var(--vscode-tab-inactive-foreground)", opacity: 0.6 }}
                          >
                            :{script.port}
                          </span>
                        )}
                        {isRunning && (
                          <motion.span
                            animate={{ opacity: [1, 0.4, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className="inline-flex h-[6px] w-[6px] rounded-full"
                            style={{ backgroundColor: "#4ec994", boxShadow: "0 0 4px #4ec994" }}
                          />
                        )}
                      </div>
                      <p
                        className="truncate text-[10px]"
                        style={{ color: "var(--vscode-tab-inactive-foreground)" }}
                      >
                        {script.description ?? script.command}
                      </p>
                    </button>

                    {/* Hover actions */}
                    <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-75 group-hover:opacity-100">
                      {isRunning && (
                        <button
                          type="button"
                          onClick={() => { onRunningChange(null); setTimeout(() => onRunningChange(script), 50); }}
                          className="vscode-list-item flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded transition-colors duration-75"
                          aria-label="Restart"
                          title="Restart"
                        >
                          <RotateCcw className="h-3 w-3" style={{ color: "var(--vscode-tab-inactive-foreground)" }} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteScript(script.id)}
                        className="vscode-list-item flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded transition-colors duration-75"
                        aria-label="Delete script"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" style={{ color: "var(--vscode-errorForeground, #f48771)" }} />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Add script */}
        <motion.button
          type="button"
          onClick={addScript}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          whileTap={{ scale: 0.97 }}
          className="mx-3 mt-1 flex w-[calc(100%-1.5rem)] items-center gap-2 rounded px-2 py-1.5 text-[11px] transition-colors duration-75"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          <Plus className="h-3 w-3" />
          Add script
        </motion.button>
      </div>

      {/* Terminal output */}
      <AnimatePresence>
        {terminalLines.length > 0 && (
          <motion.div
            key="terminal"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="overflow-hidden"
            style={{
              borderTop: "1px solid var(--vscode-panel-border)",
              backgroundColor: "var(--vscode-terminal-background, var(--vscode-editor-background))",
            }}
          >
            <div
              className="vscode-scrollable overflow-y-auto px-3 py-3 text-[11px]"
              style={{ fontFamily: "'SF Mono', Menlo, Monaco, 'Cascadia Code', monospace", maxHeight: "160px" }}
            >
              {terminalLines.map((line) => (
                <div
                  key={line.id}
                  className="leading-[1.7]"
                  style={{
                    whiteSpace: "pre-wrap",
                    color:
                      line.type === "command"
                        ? "var(--vscode-terminal-foreground, var(--vscode-editor-foreground))"
                        : line.type === "info"
                          ? "var(--vscode-terminal-ansi-green, #4ec994)"
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
              {runningScriptId && (
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
