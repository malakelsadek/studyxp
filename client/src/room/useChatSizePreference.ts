import { useCallback, useState } from "react";

export type ChatSize = "small" | "medium" | "large";

const STORAGE_KEY = "studyxp.chatSize";
const VALID_SIZES: ChatSize[] = ["small", "medium", "large"];

function loadStoredPreference(): ChatSize {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return VALID_SIZES.includes(stored as ChatSize) ? (stored as ChatSize) : "medium";
  } catch {
    return "medium";
  }
}

export function useChatSizePreference() {
  const [chatSize, setChatSizeState] = useState<ChatSize>(loadStoredPreference);

  const setChatSize = useCallback((value: ChatSize) => {
    setChatSizeState(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // best-effort persistence; a failed save just resets the preference next session
    }
  }, []);

  return { chatSize, setChatSize };
}
