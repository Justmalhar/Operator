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
    if (autoFocus) {
      inputRef.current?.focus();
    }
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
    <div className="group flex items-center gap-3 px-4 py-1.5">
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        className={cn(
          "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border transition-colors",
          todo.completed
            ? "border-[#5a5a5a] bg-[#5a5a5a]"
            : "border-[#5a5a5a] hover:border-[#8b8b8b]",
        )}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="shrink-0">
            <path d="M1 4L3.5 6.5L9 1" stroke="#f3f3f3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <input
        ref={inputRef}
        type="text"
        value={todo.text}
        placeholder="Enter todo..."
        onChange={(e) => onTextChange(todo.id, e.target.value)}
        onKeyDown={handleKeyDown}
        className={cn(
          "min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#4a4a4a]",
          todo.completed ? "text-[#5a5a5a] line-through" : "text-[#d4d4d4]",
        )}
      />
    </div>
  );
}
