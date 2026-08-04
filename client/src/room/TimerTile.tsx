import { useState } from "react";
import type { TimerMode, TimerState } from "../socket/types";
import { TimerPanel } from "./TimerPanel";
import { SharedPersonalToggle, type ViewMode } from "./SharedPersonalToggle";

interface TimerControls {
  timer: TimerState;
  startTimer: (mode: TimerMode) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

interface TimerTileProps {
  shared: TimerControls;
  personal: TimerControls;
}

export function TimerTile({ shared, personal }: TimerTileProps) {
  const [mode, setMode] = useState<ViewMode>("shared");
  const active = mode === "shared" ? shared : personal;

  return (
    <div>
      <SharedPersonalToggle mode={mode} onChange={setMode} />
      <TimerPanel
        timer={active.timer}
        onStart={active.startTimer}
        onPause={active.pauseTimer}
        onReset={active.resetTimer}
      />
    </div>
  );
}
