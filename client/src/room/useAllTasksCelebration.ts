import { useEffect, useRef } from "react";
import type { TodoItem } from "../socket/types";

export function useAllTasksCelebration(todos: TodoItem[], onComplete: () => void) {
  const wasAllDone = useRef(false);

  useEffect(() => {
    const allDone = todos.length > 0 && todos.every((t) => t.done);
    if (allDone && !wasAllDone.current) {
      onComplete();
    }
    wasAllDone.current = allDone;
  }, [todos, onComplete]);
}
