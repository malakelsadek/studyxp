import { useEffect, useState, type FormEvent } from "react";
import type { TimerMode, TimerState } from "../socket/types";
import { computeElapsedMs, formatMs, getActiveDurationMs } from "./timerMath";
import { TIMER_SOUND_OPTIONS } from "./timerSounds";

interface TimerPanelProps {
  timer: TimerState;
  onStart: (mode: TimerMode) => void;
  onPause: () => void;
  onReset: () => void;
  onSwitchPhase: () => void;
  onConfigureDurations: (workDurationMs: number, breakDurationMs: number) => void;
  soundId: string;
  onSoundChange: (id: string) => void;
  autoBreak: boolean;
  onAutoBreakChange: (value: boolean) => void;
}

export function TimerPanel({
  timer,
  onStart,
  onPause,
  onReset,
  onSwitchPhase,
  onConfigureDurations,
  soundId,
  onSoundChange,
  autoBreak,
  onAutoBreakChange,
}: TimerPanelProps) {
  const [, forceTick] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [editingDurations, setEditingDurations] = useState(false);
  const [workMinutesDraft, setWorkMinutesDraft] = useState(Math.round(timer.workDurationMs / 60000));
  const [breakMinutesDraft, setBreakMinutesDraft] = useState(Math.round(timer.breakDurationMs / 60000));

  useEffect(() => {
    if (timer.status !== "running") return;
    const id = setInterval(() => forceTick((n) => n + 1), 250);
    return () => clearInterval(id);
  }, [timer.status]);

  const elapsed = computeElapsedMs(timer);
  const activeDuration = getActiveDurationMs(timer);
  const displayMs = timer.mode === "pomodoro" ? Math.max(activeDuration - elapsed, 0) : elapsed;
  const canEdit = timer.status !== "running";

  const handleDurationsSubmit = (e: FormEvent) => {
    e.preventDefault();
    onConfigureDurations(Math.max(1, workMinutesDraft) * 60000, Math.max(1, breakMinutesDraft) * 60000);
    setEditingDurations(false);
  };

  return (
    <div className="timer-panel">
      <div className="timer-display">{formatMs(displayMs)}</div>
      <div className="timer-mode">
        {timer.mode === "pomodoro" ? `pomodoro — ${timer.phase}` : timer.mode}
      </div>
      <div className="timer-controls">
        {timer.status !== "running" ? (
          <button onClick={() => onStart(timer.mode)}>Start</button>
        ) : (
          <button onClick={onPause}>Pause</button>
        )}
        <button onClick={onReset}>Reset</button>
        <button type="button" className="timer-more-toggle" onClick={() => setShowMore((v) => !v)}>
          {showMore ? "▲ Less" : "▾ More"}
        </button>
      </div>

      {showMore && (
        <div className="timer-more">
          <div className="timer-controls timer-controls-secondary">
            <button
              className={timer.mode === "pomodoro" ? "timer-secondary-btn" : "timer-secondary-btn timer-full-span"}
              onClick={() => onStart(timer.mode === "pomodoro" ? "stopwatch" : "pomodoro")}
              disabled={timer.status === "running"}
            >
              {timer.mode === "pomodoro" ? "Stopwatch" : "Pomodoro"}
            </button>
            {timer.mode === "pomodoro" && (
              <button className="timer-secondary-btn" onClick={onSwitchPhase} disabled={timer.status === "running"}>
                Skip to {timer.phase === "work" ? "break" : "work"}
              </button>
            )}
            {timer.mode === "pomodoro" &&
              (editingDurations ? null : (
                <button
                  type="button"
                  className="timer-secondary-btn timer-full-span"
                  disabled={!canEdit}
                  onClick={() => setEditingDurations(true)}
                >
                  Edit durations
                </button>
              ))}
          </div>

          {timer.mode === "pomodoro" && (
            <label className="timer-auto-break toggle-switch">
              <span>Auto-start next phase</span>
              <input
                type="checkbox"
                checked={autoBreak}
                onChange={(e) => onAutoBreakChange(e.target.checked)}
              />
              <span className="switch-slider" />
            </label>
          )}

          {timer.mode === "pomodoro" && editingDurations && (
            <form className="timer-durations-form" onSubmit={handleDurationsSubmit}>
              <label>
                Work (min)
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={workMinutesDraft}
                  onChange={(e) => setWorkMinutesDraft(Number(e.target.value))}
                />
              </label>
              <label>
                Break (min)
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={breakMinutesDraft}
                  onChange={(e) => setBreakMinutesDraft(Number(e.target.value))}
                />
              </label>
              <div className="timer-durations-actions">
                <button type="submit">Save</button>
                <button type="button" className="timer-secondary-btn" onClick={() => setEditingDurations(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          <label className="timer-sound-picker">
            <span>Sound when done</span>
            <select value={soundId} onChange={(e) => onSoundChange(e.target.value)}>
              {TIMER_SOUND_OPTIONS.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
