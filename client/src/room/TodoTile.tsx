import { useState } from "react";
import type { TodoItem } from "../socket/types";
import { TodoList } from "./TodoList";
import { usePersonalTodos } from "./usePersonalTodos";
import { SharedPersonalToggle, type ViewMode } from "./SharedPersonalToggle";

interface TodoTileProps {
  userId: string;
  sharedTodos: TodoItem[];
  onSharedAdd: (text: string) => void;
  onSharedToggle: (id: string) => void;
  onSharedRemove: (id: string) => void;
}

export function TodoTile({ userId, sharedTodos, onSharedAdd, onSharedToggle, onSharedRemove }: TodoTileProps) {
  const [mode, setMode] = useState<ViewMode>("shared");
  const personal = usePersonalTodos(userId);

  return (
    <div>
      <SharedPersonalToggle mode={mode} onChange={setMode} />
      {mode === "shared" ? (
        <TodoList
          todos={sharedTodos}
          onAdd={onSharedAdd}
          onToggle={onSharedToggle}
          onRemove={onSharedRemove}
          showAuthor
        />
      ) : (
        <TodoList
          todos={personal.todos}
          onAdd={personal.addTodo}
          onToggle={personal.toggleTodo}
          onRemove={personal.removeTodo}
        />
      )}
    </div>
  );
}
