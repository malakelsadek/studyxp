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

const UNASSIGNED_FILTER = "__unassigned__";

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
  const [filterId, setFilterId] = useState("");
  const ownPersonalTodos = selfId ? (personalTodos[selfId] ?? []) : [];
  const assignablePlayers = Object.values(players);

  // Filter options include anyone currently in the room, plus anyone a task is still assigned
  // to even if they've since left (so their tasks stay filterable, not just "vanish").
  const filterOptions = [...assignablePlayers];
  for (const t of sharedTodos) {
    if (t.assigneeId && !filterOptions.some((p) => p.id === t.assigneeId)) {
      filterOptions.push({
        id: t.assigneeId,
        displayName: `${t.assigneeName} (left)`,
        isGuest: false,
        character: "",
        nameColor: null,
        x: 0,
        y: 0,
      });
    }
  }

  const isTodoVisible = (t: TodoItem) => {
    if (!filterId) return true;
    if (filterId === UNASSIGNED_FILTER) return !t.assigneeId;
    return t.assigneeId === filterId;
  };

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
        <>
          <select
            className="todo-filter"
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            aria-label="Filter by person"
          >
            <option value="">Everyone</option>
            <option value={UNASSIGNED_FILTER}>Unassigned</option>
            {filterOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.displayName}
              </option>
            ))}
          </select>
          <TodoList
            todos={sharedTodos}
            onAdd={(text, estimatedMinutes) => onSharedAdd(text, estimatedMinutes)}
            onToggle={onSharedToggle}
            onRemove={onSharedRemove}
            onReorder={onSharedReorder}
            showAuthor
            assignablePlayers={assignablePlayers}
            onAssign={onSharedAssign}
            isVisible={isTodoVisible}
          />
        </>
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
