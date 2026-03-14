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

  function handleAddNext() {
    handleAdd();
  }

  function handleDelete(id: string) {
    deleteTodo(id);
  }

  return (
    <div className="flex h-full flex-col bg-[#111111] text-[#f3f3f3]">
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-base font-semibold text-[#f3f3f3]">Your todos</h2>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-[#8b8b8b] transition-colors hover:bg-white/6 hover:text-[#d4d4d4]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {todos.length === 0 ? (
          <div
            className="flex cursor-text items-center gap-3 px-4 py-1.5"
            onClick={handleAdd}
          >
            <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[#3a3a3a]" />
            <span className="text-sm text-[#4a4a4a]">Enter todo...</span>
          </div>
        ) : (
          todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              autoFocus={todo.id === lastAddedId.current}
              onToggle={toggleTodo}
              onTextChange={updateTodo}
              onDelete={handleDelete}
              onAddNext={handleAddNext}
            />
          ))
        )}
      </div>
    </div>
  );
}
