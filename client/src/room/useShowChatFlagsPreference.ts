import { useCallback, useState } from "react";

const STORAGE_KEY = "studyxp.showChatFlags";

function loadStoredPreference(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === null ? true : stored === "true";
  } catch {
    return true;
  }
}

export function useShowChatFlagsPreference() {
  const [showChatFlags, setShowChatFlagsState] = useState<boolean>(loadStoredPreference);

  const setShowChatFlags = useCallback((value: boolean) => {
    setShowChatFlagsState(value);
    try {
      localStorage.setItem(STORAGE_KEY, String(value));
    } catch {
      // best-effort persistence; a failed save just resets the preference next session
    }
  }, []);

  return { showChatFlags, setShowChatFlags };
}
