import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Play, Plus, Trash2, RotateCcw } from "lucide-react";
import { springs } from "@/lib/animations";

interface SetupStep {
  id: string;
  label: string;
  command: string;
  done: boolean;
  running?: boolean;
}

const DEFAULT_STEPS: SetupStep[] = [
  { id: "1", label: "Install dependencies", command: "bun install", done: true },
  { id: "2", label: "Configure environment", command: "cp .env.example .env", done: false },
  { id: "3", label: "Migrate database", command: "bun run db:migrate", done: false },
  { id: "4", label: "Compile CSS", command: "bun run build:css", done: false },
];

export function SetupTab() {
  const [steps, setSteps] = useState<SetupStep[]>(DEFAULT_STEPS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCommand, setEditCommand] = useState("");
  const [editLabel, setEditLabel] = useState("");

  function toggleDone(id: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, done: !s.done, running: false } : s)),
    );
  }

  function runStep(id: string) {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, running: true } : s)),
    );
    // Simulate completion after 1.5s (real impl would use api.runShellCommand)
    setTimeout(() => {
      setSteps((prev) =>
        prev.map((s) => (s.id === id ? { ...s, running: false, done: true } : s)),
      );
    }, 1500);
  }

  function startEdit(step: SetupStep) {
    setEditingId(step.id);
    setEditCommand(step.command);
    setEditLabel(step.label);
  }

  function saveEdit(id: string) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, command: editCommand.trim() || s.command, label: editLabel.trim() || s.label }
          : s,
      ),
    );
    setEditingId(null);
  }

  function deleteStep(id: string) {
    setSteps((prev) => prev.filter((s) => s.id !== id));
  }

  function addStep() {
    const id = `step-${Date.now()}`;
    const newStep: SetupStep = {
      id,
      label: "New step",
      command: "",
      done: false,
    };
    setSteps((prev) => [...prev, newStep]);
    setEditingId(id);
    setEditCommand("");
    setEditLabel("New step");
  }

  const completedCount = steps.filter((s) => s.done).length;

  return (
    <div className="vscode-scrollable flex h-full flex-col overflow-y-auto">
      <div className="px-3 py-3">
        {/* Header with progress */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[12px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
            Setup scripts
          </p>
          <span className="text-[11px]" style={{ color: "var(--vscode-tab-inactive-foreground)" }}>
            {completedCount}/{steps.length} done
          </span>
        </div>

        {/* Steps */}
        <div className="flex flex-col gap-1.5">
          <AnimatePresence mode="popLayout">
            {steps.map((step) => {
              const isEditing = editingId === step.id;
              return (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4, height: 0 }}
                  transition={springs.snappy}
                  className="group flex flex-col rounded"
                  style={{
                    backgroundColor: isEditing ? "rgba(255,255,255,0.04)" : "transparent",
                    border: isEditing ? "1px solid var(--vscode-panel-border)" : "1px solid transparent",
                    padding: isEditing ? "8px" : "4px 2px",
                  }}
                >
                  {isEditing ? (
                    /* Edit mode */
                    <div className="flex flex-col gap-2">
                      <input
                        className="w-full bg-transparent text-[12px] focus:outline-none"
                        style={{
                          color: "var(--vscode-sidebar-foreground)",
                          borderBottom: "1px solid var(--vscode-panel-border)",
                          paddingBottom: "4px",
                        }}
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        placeholder="Step label"
                        autoFocus
                      />
                      <input
                        className="w-full bg-transparent font-mono text-[11px] focus:outline-none"
                        style={{ color: "#4ec994" }}
                        value={editCommand}
                        onChange={(e) => setEditCommand(e.target.value)}
                        placeholder="Command to run..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit(step.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <div className="flex justify-end gap-2">
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
                          onClick={() => saveEdit(step.id)}
                          className="text-[11px] font-medium transition-opacity hover:opacity-70"
                          style={{ color: "#4ec994" }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* View mode */
                    <div className="flex items-start gap-2">
                      {/* Done toggle */}
                      <button
                        type="button"
                        onClick={() => toggleDone(step.id)}
                        className="mt-0.5 shrink-0 transition-transform duration-75 hover:scale-110"
                        aria-label={step.done ? "Mark incomplete" : "Mark complete"}
                      >
                        {step.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "#4ec994" }} />
                        ) : (
                          <Circle className="h-3.5 w-3.5" style={{ color: "var(--vscode-tab-inactive-foreground)" }} />
                        )}
                      </button>

                      {/* Label + command */}
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => startEdit(step)}
                      >
                        <p
                          className="text-[12px] leading-tight"
                          style={{
                            color: step.done
                              ? "var(--vscode-tab-inactive-foreground)"
                              : "var(--vscode-sidebar-foreground)",
                            textDecoration: step.done ? "line-through" : undefined,
                            opacity: step.done ? 0.6 : 1,
                          }}
                        >
                          {step.label}
                        </p>
                        {step.command && (
                          <code
                            className="mt-0.5 block truncate text-[10px] font-mono"
                            style={{ color: step.done ? "var(--vscode-tab-inactive-foreground)" : "#4ec994", opacity: step.done ? 0.5 : 0.8 }}
                          >
                            {step.command}
                          </code>
                        )}
                      </button>

                      {/* Action buttons */}
                      <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-75 group-hover:opacity-100">
                        {/* Run button */}
                        <motion.button
                          type="button"
                          onClick={() => runStep(step.id)}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="flex h-[22px] w-[22px] items-center justify-center rounded transition-colors duration-75 hover:bg-white/10"
                          aria-label="Run step"
                          disabled={step.running}
                        >
                          {step.running ? (
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            >
                              <RotateCcw className="h-2.5 w-2.5" style={{ color: "#cca700" }} />
                            </motion.div>
                          ) : (
                            <Play className="h-2.5 w-2.5" style={{ color: "#4ec994" }} />
                          )}
                        </motion.button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => deleteStep(step.id)}
                          className="flex h-[22px] w-[22px] items-center justify-center rounded transition-colors duration-75 hover:bg-white/10"
                          aria-label="Delete step"
                        >
                          <Trash2 className="h-2.5 w-2.5" style={{ color: "#f48771" }} />
                        </button>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add step button */}
        <motion.button
          type="button"
          onClick={addStep}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.04)" }}
          whileTap={{ scale: 0.97 }}
          className="mt-3 flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] transition-colors duration-75"
          style={{ color: "var(--vscode-tab-inactive-foreground)" }}
        >
          <Plus className="h-3 w-3" />
          Add setup step
        </motion.button>
      </div>
    </div>
  );
}
