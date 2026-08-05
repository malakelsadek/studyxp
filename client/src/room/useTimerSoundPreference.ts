import { useCallback, useState } from "react";
import { DEFAULT_TIMER_SOUND_ID, playTimerSound, TIMER_SOUND_OPTIONS } from "./timerSounds";

const STORAGE_KEY = "studyxp.timerSound";

function loadStoredSoundId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && TIMER_SOUND_OPTIONS.some((o) => o.id === stored) ? stored : DEFAULT_TIMER_SOUND_ID;
  } catch {
    return DEFAULT_TIMER_SOUND_ID;
  }
}

export function useTimerSoundPreference() {
  const [soundId, setSoundIdState] = useState(loadStoredSoundId);

  const setSoundId = useCallback((id: string) => {
    setSoundIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // best-effort persistence; a failed save just resets the preference next session
    }
    playTimerSound(id);
  }, []);

  const play = useCallback(() => playTimerSound(soundId), [soundId]);

  return { soundId, setSoundId, play };
}
