import type { PersonalTodoItem, PlayerDTO, TodoItem } from "../socket/types";

interface PeopleProgressProps {
  players: Record<string, PlayerDTO>;
  personalTodos: Record<string, PersonalTodoItem[]>;
  todos: TodoItem[];
  selfId: string | null;
}

export function PeopleProgress({ players, personalTodos, todos, selfId }: PeopleProgressProps) {
  const others = Object.values(players).filter((p) => p.id !== selfId);

  const sharedDone = todos.filter((t) => t.done).length;
  const sharedTotal = todos.length;
  const sharedPct = sharedTotal > 0 ? Math.round((sharedDone / sharedTotal) * 100) : 0;

  return (
    <div className="people-progress">
      {sharedTotal > 0 && (
        <div className="person-progress">
          <div className="person-progress-header">
            <span>Shared tasks</span>
            <span className="person-progress-count">
              {sharedDone}/{sharedTotal}
            </span>
          </div>
          <div className="person-progress-bar">
            <div className="person-progress-fill" style={{ width: `${sharedPct}%` }} />
          </div>
          <ul className="person-progress-tasks">
            {todos.map((t) => (
              <li key={t.id} className={t.done ? "done" : ""}>
                {t.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {others.length === 0 ? (
        <p className="profile-muted">No one else here yet.</p>
      ) : (
        others.map((player) => {
          const items = personalTodos[player.id] ?? [];
          const done = items.filter((t) => t.done).length;
          const total = items.length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;

          return (
            <div key={player.id} className="person-progress">
              <div className="person-progress-header">
                <span>{player.displayName}</span>
                <span className="person-progress-count">
                  {done}/{total}
                </span>
              </div>
              <div className="person-progress-bar">
                <div className="person-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              {total > 0 ? (
                <ul className="person-progress-tasks">
                  {items.map((t) => (
                    <li key={t.id} className={t.done ? "done" : ""}>
                      {t.text}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="profile-muted">Nothing visible yet.</p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
