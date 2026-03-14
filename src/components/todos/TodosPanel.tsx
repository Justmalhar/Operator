import { useRef } from "react";
import { Plus } from "lucide-react";
import { useTodoStore } from "@/store/todoStore";
import { TodoItem } from "./TodoItem";

export function TodosPanel() {
  const { todos, addTodo, toggleTodo, updateTodo, deleteTodo } = useTodoStore();
  const lastAddedId = useRef<string | null>(null);

  function handleAdd() {
    const id = addTodo();
    lastAddedId.current = id;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="vscode-sidebar-section-header flex shrink-0 items-center justify-between px-4" style={{ height: "35px" }}>
        <span className="vscode-sidebar-title">Todos</span>
        <button
          type="button"
          onClick={handleAdd}
          className="vscode-list-item flex h-[22px] w-[22px] items-center justify-center rounded transition-colors duration-75"
          style={{ color: "var(--vscode-sidebar-section-header-foreground)" }}
          aria-label="Add todo"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* List */}
      <div className="vscode-scrollable min-h-0 flex-1 overflow-y-auto py-1">
        {todos.length === 0 ? (
          <button
            type="button"
            className="vscode-list-item flex w-full items-center gap-2.5 px-4 py-[5px] text-left transition-colors duration-75"
            onClick={handleAdd}
          >
            <span
              className="flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border transition-colors"
              style={{ borderColor: "var(--vscode-list-inactive-selection-background)" }}
            />
            <span className="text-[13px]" style={{ color: "var(--vscode-input-placeholder-foreground)" }}>
              Add a todo...
            </span>
          </button>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              autoFocus={todo.id === lastAddedId.current}
              onToggle={toggleTodo}
              onTextChange={updateTodo}
              onDelete={deleteTodo}
              onAddNext={handleAdd}
            />
          ))
        )}
      </div>
    </div>
  );
}
