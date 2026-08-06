import { useCallback, useState } from "react";

const STORAGE_KEY = "studyxp.autoBreak";

function loadStoredPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function useTimerAutoBreakPreference() {
  const [autoBreak, setAutoBreakState] = useState(loadStoredPreference);

  const setAutoBreak = useCallback((value: boolean) => {
    setAutoBreakState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // best-effort persistence; a failed save just resets the preference next session
    }
  }, []);

  return { autoBreak, setAutoBreak };
}
