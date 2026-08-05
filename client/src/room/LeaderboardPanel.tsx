import { useState } from "react";
import type { LeaderboardEntry } from "../socket/types";

interface LeaderboardPanelProps {
  leaderboard: LeaderboardEntry[];
  selfId: string | null;
}

type SortBy = "studyMs" | "tasksCompleted";

function formatStudyTime(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

export function LeaderboardPanel({ leaderboard, selfId }: LeaderboardPanelProps) {
  const [sortBy, setSortBy] = useState<SortBy>("studyMs");

  if (leaderboard.length === 0) {
    return <p className="profile-muted">No activity logged in this room yet.</p>;
  }

  const sorted = [...leaderboard].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="leaderboard-panel">
      <div className="leaderboard-tabs">
        <button className={sortBy === "studyMs" ? "active" : ""} onClick={() => setSortBy("studyMs")}>
          Study time
        </button>
        <button
          className={sortBy === "tasksCompleted" ? "active" : ""}
          onClick={() => setSortBy("tasksCompleted")}
        >
          Tasks done
        </button>
      </div>
      <ol className="leaderboard-list">
        {sorted.map((entry, i) => (
          <li key={entry.id} className={entry.id === selfId ? "leaderboard-self" : ""}>
            <span className="leaderboard-rank">#{i + 1}</span>
            <span className="leaderboard-name">{entry.displayName}</span>
            <span className="leaderboard-metric">
              {sortBy === "studyMs" ? formatStudyTime(entry.studyMs) : `✅ ${entry.tasksCompleted}`}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
