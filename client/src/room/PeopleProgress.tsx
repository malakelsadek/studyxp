import type { PersonalTodoItem, PlayerDTO } from "../socket/types";

interface PeopleProgressProps {
  players: Record<string, PlayerDTO>;
  personalTodos: Record<string, PersonalTodoItem[]>;
  selfId: string | null;
}

export function PeopleProgress({ players, personalTodos, selfId }: PeopleProgressProps) {
  const others = Object.values(players).filter((p) => p.id !== selfId);

  if (others.length === 0) {
    return <p className="profile-muted">No one else here yet.</p>;
  }

  return (
    <div className="people-progress">
      {others.map((player) => {
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
      })}
    </div>
  );
}
