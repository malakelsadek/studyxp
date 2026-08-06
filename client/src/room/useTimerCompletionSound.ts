import { useEffect, useRef } from "react";
import type { TimerState } from "../socket/types";
import { computeElapsedMs, getActiveDurationMs } from "./timerMath";

const POLL_INTERVAL_MS = 250;

export function useTimerCompletionSound(
  timer: TimerState,
  onComplete: () => void,
  autoAdvance = false,
  onAdvance?: () => void,
) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (timer.mode !== "pomodoro" || timer.status !== "running") {
      firedRef.current = false;
      return;
    }

    const activeDurationMs = getActiveDurationMs(timer);
    const interval = setInterval(() => {
      if (firedRef.current) return;
      if (computeElapsedMs(timer) >= activeDurationMs) {
        firedRef.current = true;
        onComplete();
        if (autoAdvance) onAdvance?.();
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [timer, onComplete, autoAdvance, onAdvance]);
}
