import { useState, type FormEvent } from "react";
import type { TodoItem } from "../socket/types";

interface TodoListProps {
  todos: TodoItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  showAuthor?: boolean;
}

export function TodoList({ todos, onAdd, onToggle, onRemove, showAuthor }: TodoListProps) {
  const [text, setText] = useState("");

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };

  return (
    <div className="todo-list">
      <ul className="todo-items">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? "done" : ""}>
            <label>
              <input type="checkbox" checked={todo.done} onChange={() => onToggle(todo.id)} />
              <span>{todo.text}</span>
            </label>
            {showAuthor && <span className="todo-author">{todo.addedBy}</span>}
            <button onClick={() => onRemove(todo.id)} aria-label="Remove">
              ×
            </button>
          </li>
        ))}
      </ul>
      <form onSubmit={handleSubmit} className="todo-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a task..."
          maxLength={200}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}
