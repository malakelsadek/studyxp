import { useState } from "react";
import type { TimerMode, TimerState } from "../socket/types";
import { computeElapsedMs, defaultTimer } from "./timerMath";

export function usePersonalTimer() {
  const [timer, setTimer] = useState<TimerState>(defaultTimer());

  const startTimer = (mode: TimerMode) => {
    setTimer((prev) => {
      const base = prev.mode !== mode || prev.status === "idle" ? defaultTimer(mode) : prev;
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

  const resetTimer = () => setTimer((prev) => defaultTimer(prev.mode));

  return { timer, startTimer, pauseTimer, resetTimer };
}
