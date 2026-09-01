import { useState } from "react";
import type { PersonalTodoItem, PlayerDTO, TodoItem } from "../socket/types";
import { TodoList } from "./TodoList";

type TodoTab = "shared" | "personal";

interface TodoTileProps {
  onOpenPeople: () => void;
  peopleOpen: boolean;
  selfId: string | null;
  players: Record<string, PlayerDTO>;
  sharedTodos: TodoItem[];
  onSharedAdd: (text: string, estimatedMinutes: number | null) => void;
  onSharedToggle: (id: string) => void;
  onSharedRemove: (id: string) => void;
  onSharedReorder: (orderedIds: string[]) => void;
  onSharedAssign: (id: string, assigneeId: string | null) => void;
  personalTodos: Record<string, PersonalTodoItem[]>;
  onPersonalAdd: (text: string, estimatedMinutes: number | null, isPrivate: boolean) => void;
  onPersonalToggle: (id: string) => void;
  onPersonalRemove: (id: string) => void;
  onPersonalReorder: (orderedIds: string[]) => void;
}

export function TodoTile({
  onOpenPeople,
  peopleOpen,
  selfId,
  players,
  sharedTodos,
  onSharedAdd,
  onSharedToggle,
  onSharedRemove,
  onSharedReorder,
  onSharedAssign,
  personalTodos,
  onPersonalAdd,
  onPersonalToggle,
  onPersonalRemove,
  onPersonalReorder,
}: TodoTileProps) {
  const [tab, setTab] = useState<TodoTab>("shared");
  const ownPersonalTodos = selfId ? (personalTodos[selfId] ?? []) : [];

  return (
    <div>
      <div className="todo-tabs">
        <button className={tab === "shared" ? "active" : ""} onClick={() => setTab("shared")}>
          Shared
        </button>
        <button className={tab === "personal" ? "active" : ""} onClick={() => setTab("personal")}>
          Personal
        </button>
        <button className={peopleOpen ? "active" : ""} onClick={onOpenPeople} title="People (Alt+P)">
          People
        </button>
      </div>

      {tab === "shared" && (
        <TodoList
          todos={sharedTodos}
          onAdd={(text, estimatedMinutes) => onSharedAdd(text, estimatedMinutes)}
          onToggle={onSharedToggle}
          onRemove={onSharedRemove}
          onReorder={onSharedReorder}
          showAuthor
          assignablePlayers={Object.values(players)}
          onAssign={onSharedAssign}
        />
      )}

      {tab === "personal" && (
        <TodoList
          todos={ownPersonalTodos}
          onAdd={onPersonalAdd}
          onToggle={onPersonalToggle}
          onRemove={onPersonalRemove}
          onReorder={onPersonalReorder}
          showPrivateToggle
        />
      )}
    </div>
  );
}
