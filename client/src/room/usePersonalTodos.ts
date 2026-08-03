import { useEffect, useState } from "react";
import type { TodoItem } from "../socket/types";

function storageKey(userId: string) {
  return `studyxp.personalTodos.${userId}`;
}

function loadTodos(userId: string): TodoItem[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? (JSON.parse(raw) as TodoItem[]) : [];
  } catch {
    return [];
  }
}

export function usePersonalTodos(userId: string) {
  const [todos, setTodos] = useState<TodoItem[]>(() => loadTodos(userId));

  useEffect(() => {
    localStorage.setItem(storageKey(userId), JSON.stringify(todos));
  }, [userId, todos]);

  const addTodo = (text: string) => {
    if (!text.trim()) return;
    setTodos((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, text: text.trim(), done: false, addedBy: "You" },
    ]);
  };

  const toggleTodo = (id: string) => {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  return { todos, addTodo, toggleTodo, removeTodo };
}
