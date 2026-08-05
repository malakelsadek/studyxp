import { useEffect, useRef } from "react";
import type { TimerState } from "../socket/types";
import { computeElapsedMs } from "./timerMath";
import { postStudySession } from "../lib/api";

const MIN_LOGGABLE_MS = 5000;

export function useStudySessionLogger(
  timer: TimerState,
  roomId: string,
  token: string | null,
  logStudyTime: (durationMs: number) => void,
  onCoinsEarned: (coins: number) => void,
) {
  const prevTimerRef = useRef(timer);

  useEffect(() => {
    const prev = prevTimerRef.current;
    if (prev.status === "running" && timer.status !== "running" && prev.phase !== "break") {
      const elapsedMs = computeElapsedMs(prev);
      if (elapsedMs >= MIN_LOGGABLE_MS) {
        logStudyTime(elapsedMs);
        if (token) {
          postStudySession(token, { durationMs: elapsedMs, mode: prev.mode, roomId })
            .then(({ coins }) => onCoinsEarned(coins))
            .catch(() => {
              // best-effort; a dropped stats log shouldn't disrupt the timer UI
            });
        }
      }
    }
    prevTimerRef.current = timer;
  }, [timer, roomId, token, logStudyTime, onCoinsEarned]);
}
