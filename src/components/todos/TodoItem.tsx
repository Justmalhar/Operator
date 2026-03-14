import { useRef, useEffect, KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { Todo } from "@/types/todo";

interface TodoItemProps {
  todo: Todo;
  autoFocus?: boolean;
  onToggle: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onAddNext: () => void;
}

export function TodoItem({ todo, autoFocus, onToggle, onTextChange, onDelete, onAddNext }: TodoItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      onAddNext();
    } else if (e.key === "Backspace" && todo.text === "") {
      e.preventDefault();
      onDelete(todo.id);
    }
  }

  return (
    <div className="vscode-list-item group flex items-center gap-2.5 px-4 py-[5px] transition-colors duration-75">
      {/* Checkbox */}
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border transition-all duration-150"
        style={{
          borderColor: todo.completed ? "var(--vscode-focus-border)" : "var(--vscode-list-inactive-selection-background)",
          backgroundColor: todo.completed ? "var(--vscode-focus-border)" : "transparent",
        }}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none" className="shrink-0">
            <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Text */}
      <input
        ref={inputRef}
        type="text"
        value={todo.text}
        placeholder="Todo..."
        onChange={(e) => onTextChange(todo.id, e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn("min-w-0 flex-1 bg-transparent text-[13px] outline-none", todo.completed && "line-through")}
        style={{
          color: todo.completed
            ? "var(--vscode-tab-inactive-foreground)"
            : "var(--vscode-list-foreground, var(--vscode-sidebar-foreground))",
        }}
      />
    </div>
  );
}
