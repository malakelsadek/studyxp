import { useCallback, useState } from "react";
import { DEFAULT_MESSAGE_SOUND_ID, MESSAGE_SOUND_OPTIONS, playMessageSound } from "./messageSounds";

const STORAGE_KEY = "studyxp.messageSound";

function loadStoredSoundId(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && MESSAGE_SOUND_OPTIONS.some((o) => o.id === stored) ? stored : DEFAULT_MESSAGE_SOUND_ID;
  } catch {
    return DEFAULT_MESSAGE_SOUND_ID;
  }
}

export function useMessageSoundPreference() {
  const [soundId, setSoundIdState] = useState(loadStoredSoundId);

  const setSoundId = useCallback((id: string) => {
    setSoundIdState(id);
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // best-effort persistence; a failed save just resets the preference next session
    }
    playMessageSound(id);
  }, []);

  const play = useCallback(() => playMessageSound(soundId), [soundId]);

  return { soundId, setSoundId, play };
}
