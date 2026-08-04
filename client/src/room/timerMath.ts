import type { TimerMode, TimerState } from "../socket/types";

export const DEFAULT_WORK_MS = 25 * 60 * 1000;
export const DEFAULT_BREAK_MS = 5 * 60 * 1000;

export function defaultTimer(
  mode: TimerMode = "pomodoro",
  workDurationMs = DEFAULT_WORK_MS,
  breakDurationMs = DEFAULT_BREAK_MS,
): TimerState {
  return {
    mode,
    phase: "work",
    status: "idle",
    workDurationMs,
    breakDurationMs,
    elapsedMsAtStart: 0,
    startedAt: null,
  };
}

export function computeElapsedMs(timer: TimerState): number {
  if (timer.status === "running" && timer.startedAt !== null) {
    return timer.elapsedMsAtStart + (Date.now() - timer.startedAt);
  }
  return timer.elapsedMsAtStart;
}

export function getActiveDurationMs(timer: TimerState): number {
  if (timer.mode !== "pomodoro") return 0;
  return timer.phase === "work" ? timer.workDurationMs : timer.breakDurationMs;
}

export function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function formatDurationLong(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}
