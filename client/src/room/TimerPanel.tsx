import { useEffect, useState } from "react";
import type { TimerMode, TimerState } from "../socket/types";
import { computeElapsedMs, formatMs } from "./timerMath";

interface TimerPanelProps {
  timer: TimerState;
  onStart: (mode: TimerMode) => void;
  onPause: () => void;
  onReset: () => void;
}

export function TimerPanel({ timer, onStart, onPause, onReset }: TimerPanelProps) {
  const [, forceTick] = useState(0);

  useEffect(() => {
    if (timer.status !== "running") return;
    const id = setInterval(() => forceTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [timer.status]);

  const elapsed = computeElapsedMs(timer);
  const displayMs = timer.mode === "pomodoro" ? Math.max(timer.durationMs - elapsed, 0) : elapsed;

  return (
    <div className="timer-panel">
      <div className="timer-display">{formatMs(displayMs)}</div>
      <div className="timer-mode">{timer.mode}</div>
      <div className="timer-controls">
        {timer.status !== "running" ? (
          <button onClick={() => onStart(timer.mode)}>Start</button>
        ) : (
          <button onClick={onPause}>Pause</button>
        )}
        <button onClick={onReset}>Reset</button>
        <button
          onClick={() => onStart(timer.mode === "pomodoro" ? "stopwatch" : "pomodoro")}
          disabled={timer.status === "running"}
        >
          Switch to {timer.mode === "pomodoro" ? "stopwatch" : "pomodoro"}
        </button>
      </div>
    </div>
  );
}
