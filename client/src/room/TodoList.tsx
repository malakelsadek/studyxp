import { useRef, useState, type DragEvent, type FormEvent } from "react";
import type { PlayerDTO, TodoItem } from "../socket/types";
import { formatDurationLong } from "./timerMath";

interface TodoListProps {
  todos: TodoItem[];
  onAdd: (text: string, estimatedMinutes: number | null, isPrivate: boolean, assigneeId: string | null) => void;
  onEdit: (id: string, text: string, estimatedMinutes: number | null, isPrivate: boolean) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onReorder: (orderedIds: string[]) => void;
  showAuthor?: boolean;
  showPrivateToggle?: boolean;
  assignablePlayers?: PlayerDTO[];
  onAssign?: (id: string, assigneeId: string | null) => void;
  // Filters which todos render, without changing the drag-reorder id list below (which must
  // stay derived from the full `todos` array — reordering only the filtered subset would
  // reassign small 0..N indices that collide with the order values of hidden items).
  isVisible?: (todo: TodoItem) => boolean;
}

function sumEstimate(items: TodoItem[]): number {
  return items.reduce((sum, t) => sum + (t.estimatedMinutes ?? 0), 0);
}

export function TodoList({
  todos,
  onAdd,
  onEdit,
  onToggle,
  onRemove,
  onReorder,
  showAuthor,
  showPrivateToggle,
  assignablePlayers,
  onAssign,
  isVisible,
}: TodoListProps) {
  const [modalTodoId, setModalTodoId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [text, setText] = useState("");
  const [estimateDraft, setEstimateDraft] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [assigneeDraft, setAssigneeDraft] = useState("");
  const [dragId, setDragId] = useState<string | null>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  const editingTodo = modalTodoId ? todos.find((t) => t.id === modalTodoId) : null;
  const modalOpen = showAddModal || !!editingTodo;

  const focusTextInput = () => setTimeout(() => textInputRef.current?.focus(), 0);

  const openAddModal = () => {
    setShowAddModal(true);
    setText("");
    setEstimateDraft("");
    setIsPrivate(false);
    setAssigneeDraft("");
    focusTextInput();
  };

  const openEditModal = (todo: TodoItem) => {
    setModalTodoId(todo.id);
    setText(todo.text);
    setEstimateDraft(todo.estimatedMinutes != null ? String(todo.estimatedMinutes) : "");
    setIsPrivate("private" in todo ? Boolean((todo as { private?: boolean }).private) : false);
    setAssigneeDraft(todo.assigneeId ?? "");
    focusTextInput();
  };

  const closeModal = () => {
    setShowAddModal(false);
    setModalTodoId(null);
    setText("");
    setEstimateDraft("");
    setIsPrivate(false);
    setAssigneeDraft("");
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    const estimatedMinutes = estimateDraft.trim() ? Math.max(1, Number(estimateDraft)) : null;
    if (editingTodo) {
      onEdit(editingTodo.id, text.trim(), estimatedMinutes, isPrivate);
      if (assignablePlayers && onAssign && assigneeDraft !== (editingTodo.assigneeId ?? "")) {
        onAssign(editingTodo.id, assigneeDraft || null);
      }
    } else {
      onAdd(text.trim(), estimatedMinutes, isPrivate, assigneeDraft || null);
    }
    closeModal();
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

  const visibleTodos = isVisible ? todos.filter(isVisible) : todos;
  const total = sumEstimate(visibleTodos);
  const remaining = sumEstimate(visibleTodos.filter((t) => !t.done));

  return (
    <div className="todo-list">
      <ul className="todo-items">
        {visibleTodos.map((todo) => {
          const hasMeta = todo.estimatedMinutes != null || showAuthor || (assignablePlayers && onAssign);
          return (
            <li
              key={todo.id}
              className={`todo-item ${todo.done ? "done" : ""}`}
              draggable
              onDragStart={handleDragStart(todo.id)}
              onDragOver={handleDragOver(todo.id)}
              onDrop={handleDrop(todo.id)}
            >
              <div className="todo-item-main">
                <span className="todo-drag-handle">⠿</span>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => onToggle(todo.id)}
                  aria-label={todo.done ? "Mark not done" : "Mark done"}
                />
                <p className="todo-item-text" onClick={() => openEditModal(todo)}>
                  {todo.text}
                </p>
                <button onClick={() => onRemove(todo.id)} aria-label="Remove">
                  ×
                </button>
              </div>
              {hasMeta && (
                <div className="todo-item-meta">
                  {todo.estimatedMinutes != null && (
                    <span className="todo-estimate">{formatDurationLong(todo.estimatedMinutes * 60000)}</span>
                  )}
                  {showAuthor && <span className="todo-author">{todo.addedBy}</span>}
                  {assignablePlayers && onAssign && (
                    <select
                      className="todo-assignee"
                      value={todo.assigneeId ?? ""}
                      onChange={(e) => onAssign(todo.id, e.target.value || null)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label="Assign to"
                    >
                      <option value="">Unassigned</option>
                      {todo.assigneeId && !assignablePlayers.some((p) => p.id === todo.assigneeId) && (
                        <option value={todo.assigneeId}>{todo.assigneeName} (left)</option>
                      )}
                      {assignablePlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.displayName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {total > 0 && (
        <div className="todo-total">
          Total: {formatDurationLong(total * 60000)} ({formatDurationLong(remaining * 60000)} remaining)
        </div>
      )}

      <button type="button" className="todo-add-trigger" onClick={openAddModal}>
        + Add task
      </button>

      {modalOpen && (
        <div className="todo-add-modal-backdrop" onClick={closeModal}>
          <div className="todo-add-modal" onClick={(e) => e.stopPropagation()}>
            <h3>{editingTodo ? "Edit task" : "Add task"}</h3>
            <form onSubmit={handleSubmit} className="todo-add-form">
              <input
                ref={textInputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Task name..."
                maxLength={200}
              />
              <label className="todo-add-estimate-label">
                Estimated time (minutes, optional)
                <input
                  value={estimateDraft}
                  onChange={(e) => setEstimateDraft(e.target.value)}
                  placeholder="e.g. 25"
                  type="number"
                  min={1}
                />
              </label>
              {assignablePlayers && onAssign && (
                <label className="todo-add-estimate-label">
                  Assign to
                  <select value={assigneeDraft} onChange={(e) => setAssigneeDraft(e.target.value)}>
                    <option value="">Unassigned</option>
                    {editingTodo?.assigneeId &&
                      !assignablePlayers.some((p) => p.id === editingTodo.assigneeId) && (
                        <option value={editingTodo.assigneeId}>{editingTodo.assigneeName} (left)</option>
                      )}
                    {assignablePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.displayName}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {showPrivateToggle && (
                <label className="todo-private-toggle">
                  <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />
                  Private (hide from others)
                </label>
              )}
              <div className="todo-add-form-actions">
                <button type="submit" disabled={!text.trim()}>
                  {editingTodo ? "Save" : "Add"}
                </button>
                <button type="button" onClick={closeModal}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
