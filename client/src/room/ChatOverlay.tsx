import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "../socket/types";

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  active: boolean;
}

export function ChatOverlay({ messages, onSend, active }: ChatOverlayProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="chat-overlay">
      <div className="chat-overlay-messages">
        {messages.slice(-16).map((m) => (
          <div key={m.id} className="chat-overlay-message">
            <span className="chat-from">{m.from}:</span> {m.text}
          </div>
        ))}
      </div>
      {active && (
        <form onSubmit={handleSubmit} className="chat-overlay-input">
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Say something... (Esc to close)"
            maxLength={500}
          />
        </form>
      )}
    </div>
  );
}
