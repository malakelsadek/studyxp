import { useState } from "react";
import type { TimerMode, TimerState } from "../socket/types";
import { computeElapsedMs, defaultTimer } from "./timerMath";

export function usePersonalTimer() {
  const [timer, setTimer] = useState<TimerState>(defaultTimer());

  const startTimer = (mode: TimerMode) => {
    setTimer((prev) => {
      const base =
        prev.mode !== mode || prev.status === "idle"
          ? defaultTimer(mode, prev.workDurationMs, prev.breakDurationMs)
          : prev;
      return { ...base, status: "running", startedAt: Date.now() };
    });
  };

  const pauseTimer = () => {
    setTimer((prev) => ({
      ...prev,
      elapsedMsAtStart: computeElapsedMs(prev),
      status: "paused",
      startedAt: null,
    }));
  };

  const resetTimer = () =>
    setTimer((prev) => defaultTimer(prev.mode, prev.workDurationMs, prev.breakDurationMs));

  const switchPhase = () => {
    setTimer((prev) => {
      const next = defaultTimer(prev.mode, prev.workDurationMs, prev.breakDurationMs);
      next.phase = prev.phase === "work" ? "break" : "work";
      return next;
    });
  };

  const configureDurations = (workDurationMs: number, breakDurationMs: number) => {
    setTimer((prev) =>
      prev.status === "running" ? prev : { ...prev, workDurationMs, breakDurationMs, elapsedMsAtStart: 0 },
    );
  };

  return { timer, startTimer, pauseTimer, resetTimer, switchPhase, configureDurations };
}
