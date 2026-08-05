import type { LeaderboardEntry } from "../socket/types";

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[];
  selfId: string | null;
}

function formatStudyTime(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function LeaderboardPanel({ leaderboard, selfId }: LeaderboardPanelProps) {
  if (leaderboard.length === 0) {
    return <p className="profile-muted">No one has logged study time in this room yet.</p>;
  }

  return (
    <ol className="leaderboard-list">
      {leaderboard.map((entry, i) => (
        <li key={entry.id} className={entry.id === selfId ? "leaderboard-self" : ""}>
          <span className="leaderboard-rank">#{i + 1}</span>
          <span className="leaderboard-name">{entry.displayName}</span>
          <span className="leaderboard-time">{formatStudyTime(entry.studyMs)}</span>
        </li>
      ))}
    </ol>
  );
}
