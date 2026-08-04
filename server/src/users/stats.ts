import { prisma } from "../prisma.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HEATMAP_DAYS = 84;
const STREAK_LOOKBACK_DAYS = 400;
const STREAK_SAFETY_CAP = 3650;

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface UserStats {
  totalTodayMs: number;
  totalWeekMs: number;
  totalAllTimeMs: number;
  streak: number;
  heatmap: Array<{ date: string; durationMs: number }>;
}

export async function getUserStats(userId: string): Promise<UserStats> {
  const now = new Date();
  const since = new Date(now.getTime() - STREAK_LOOKBACK_DAYS * DAY_MS);

  const [sessions, allTimeAgg] = await Promise.all([
    prisma.studySession.findMany({
      where: { userId, startedAt: { gte: since } },
      select: { durationMs: true, startedAt: true },
    }),
    prisma.studySession.aggregate({
      where: { userId },
      _sum: { durationMs: true },
    }),
  ]);

  const byDate = new Map<string, number>();
  for (const s of sessions) {
    const key = toDateKey(s.startedAt);
    byDate.set(key, (byDate.get(key) ?? 0) + s.durationMs);
  }

  const dateKeyForOffset = (offsetDays: number) => toDateKey(new Date(now.getTime() - offsetDays * DAY_MS));

  const totalTodayMs = byDate.get(dateKeyForOffset(0)) ?? 0;

  let totalWeekMs = 0;
  for (let i = 0; i < 7; i++) {
    totalWeekMs += byDate.get(dateKeyForOffset(i)) ?? 0;
  }

  let streak = 0;
  for (let i = 0; i < STREAK_SAFETY_CAP; i++) {
    const hasSession = (byDate.get(dateKeyForOffset(i)) ?? 0) > 0;
    if (hasSession) {
      streak++;
    } else if (i === 0) {
      continue;
    } else {
      break;
    }
  }

  const heatmap: Array<{ date: string; durationMs: number }> = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i--) {
    const key = dateKeyForOffset(i);
    heatmap.push({ date: key, durationMs: byDate.get(key) ?? 0 });
  }

  return {
    totalTodayMs,
    totalWeekMs,
    totalAllTimeMs: allTimeAgg._sum.durationMs ?? 0,
    streak,
    heatmap,
  };
}
