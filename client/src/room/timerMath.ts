import type { TimerMode, TimerState } from "../socket/types";

export const POMODORO_DURATION_MS = 25 * 60 * 1000;

export function defaultTimer(mode: TimerMode = "pomodoro"): TimerState {
  return {
    mode,
    status: "idle",
    durationMs: mode === "pomodoro" ? POMODORO_DURATION_MS : 0,
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

export function formatMs(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}
