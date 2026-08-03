import { useState } from "react";
import type { TimerMode, TimerState } from "../socket/types";
import { TimerPanel } from "./TimerPanel";
import { usePersonalTimer } from "./usePersonalTimer";
import { SharedPersonalToggle, type ViewMode } from "./SharedPersonalToggle";

interface TimerTileProps {
  sharedTimer: TimerState;
  onSharedStart: (mode: TimerMode) => void;
  onSharedPause: () => void;
  onSharedReset: () => void;
}

export function TimerTile({ sharedTimer, onSharedStart, onSharedPause, onSharedReset }: TimerTileProps) {
  const [mode, setMode] = useState<ViewMode>("shared");
  const personal = usePersonalTimer();

  return (
    <div>
      <SharedPersonalToggle mode={mode} onChange={setMode} />
      {mode === "shared" ? (
        <TimerPanel timer={sharedTimer} onStart={onSharedStart} onPause={onSharedPause} onReset={onSharedReset} />
      ) : (
        <TimerPanel
          timer={personal.timer}
          onStart={personal.startTimer}
          onPause={personal.pauseTimer}
          onReset={personal.resetTimer}
        />
      )}
    </div>
  );
}
