import { create } from "zustand";
import { produce } from "immer";
import type { Todo } from "@/types/todo";

interface TodoState {
  todos: Todo[];
  addTodo: (text?: string) => string;
  updateTodo: (id: string, text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
}

export const useTodoStore = create<TodoState>((set) => ({
  todos: [],

  addTodo: (text = "") => {
    const id = crypto.randomUUID();
    set(
      produce<TodoState>((state) => {
        state.todos.push({ id, text, completed: false, createdAt: Date.now() });
      }),
    );
    return id;
  },

  updateTodo: (id, text) =>
    set(
      produce<TodoState>((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.text = text;
      }),
    ),

  toggleTodo: (id) =>
    set(
      produce<TodoState>((state) => {
        const todo = state.todos.find((t) => t.id === id);
        if (todo) todo.completed = !todo.completed;
      }),
    ),

  deleteTodo: (id) =>
    set(
      produce<TodoState>((state) => {
        state.todos = state.todos.filter((t) => t.id !== id);
      }),
    ),
}));
