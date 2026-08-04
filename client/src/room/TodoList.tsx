import { useState, type DragEvent, type FormEvent } from "react";
import type { TodoItem } from "../socket/types";
import { formatDurationLong } from "./timerMath";

interface TodoListProps {
  todos: TodoItem[];
  onAdd: (text: string, estimatedMinutes: number | null, isPrivate: boolean) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  showAuthor?: boolean;
  showPrivateToggle?: boolean;
}

function sumEstimate(items: TodoItem[]): number {
  return items.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
}

export function TodoList({
  todos,
  onAdd,
  onToggle,
  onRemove,
  onReorder,
  showAuthor,
  showPrivateToggle,
}: TodoListProps) {
  const [text, setText] = useState("");
  const [estimateDraft, setEstimateDraft] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const estimatedMinutes = estimateDraft.trim() ? Math.max(1, Number(estimateDraft)) : null;
    onAdd(text.trim(), estimatedMinutes, isPrivate);
    setText("");
    setEstimateDraft("");
    setIsPrivate(false);
  };

  const handleDragStart = (id: string) => (e: DragEvent) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (overId: string) => (e: DragEvent) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
  };

  const handleDrop = (overId: string) => (e: DragEvent) => {
    e.preventDefault();
    if (!dragId || dragId === overId) return;
    const ids = todos.map((t) => t.id);
    const fromIdx = ids.indexOf(dragId);
    const toIdx = ids.indexOf(overId);
    if (fromIdx === -1 || toIdx === -1) return;
    ids.splice(fromIdx, 1);
    ids.splice(toIdx, 0, dragId);
    onReorder(ids);
    setDragId(null);
  };

  const total = sumEstimate(todos);
  const remaining = sumEstimate(todos.filter((t) => !t.done));

  return (
    <div className="todo-list">
      <ul className="todo-items">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={todo.done ? "done" : ""}
            draggable
            onDragStart={handleDragStart(todo.id)}
            onDragOver={handleDragOver(todo.id)}
            onDrop={handleDrop(todo.id)}
          >
            <span className="todo-drag-handle">⠿</span>
            <label>
              <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
              <span>{todo.text}</span>
            </label>
            {todo.estimatedMinutes != null && (
              <span className="todo-estimate">{formatDurationLong(todo.estimatedMinutes * 60000)}</span>
            )}
            {showAuthor && <span className="todo-author">{todo.addedBy}</span>}
            <button onClick={() => onRemove(todo.id)} aria-label="Remove">
              ×
            </button>
          </li>
        ))}
      </ul>

      {total > 0 && (
        <div className="todo-total">
          Total: {formatDurationLong(total * 60000)} ({formatDurationLong(remaining * 60000)} remaining)
        </div>
      )}

      <form onSubmit={handleSubmit} className="todo-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task..."
          maxLength={200}
        />
        <input
          className="todo-estimate-input"
          value={estimateDraft}
          onChange={(e) => setEstimateDraft(e.target.value)}
          placeholder="min"
          type="number"
          min={1}
        />
        <button type="submit">Add</button>
      </form>
      {showPrivateToggle && (
        <label className="todo-private-toggle">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
          Private (hide from others)
        </label>
      )}
    </div>
  );
}
