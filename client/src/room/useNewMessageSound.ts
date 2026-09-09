import { useEffect, useRef } from "react";
import type { ChatMessage } from "../socket/types";

export function useNewMessageSound(messages: ChatMessage[], selfId: string | null, onNewMessage: () => void) {
  const seenIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (seenIds.current === null) {
      seenIds.current = new Set(messages.map((m) => m.id));
      return;
    }
    for (const message of messages) {
      if (seenIds.current.has(message.id)) continue;
      seenIds.current.add(message.id);
      if (message.fromId === selfId) continue;
      onNewMessage();
    }
  }, [messages, selfId, onNewMessage]);
}
