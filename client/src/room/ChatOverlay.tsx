import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "../socket/types";
import { colorForUser } from "../lib/userColor";

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  active: boolean;
  showMessages: boolean;
  onToggleMessages: () => void;
}

export function ChatOverlay({ messages, onSend, active, showMessages, onToggleMessages }: ChatOverlayProps) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  useEffect(() => {
    if (!showMessages) return;
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, showMessages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className="chat-overlay">
      <button type="button" className="chat-overlay-toggle" onClick={onToggleMessages}>
        {showMessages ? "Hide chat" : "Show chat"}
      </button>

      {showMessages && (
        <div className="chat-overlay-messages" ref={messagesRef}>
          {messages.length === 0 ? (
            <p className="chat-overlay-empty">No messages yet.</p>
          ) : (
            messages.map((m) => (
              <p key={m.id} className="chat-overlay-message">
                <span className="chat-time">{formatTime(m.at)}</span>{" "}
                <span className="chat-from" style={{ color: m.nameColor ?? colorForUser(m.fromId) }}>
                  {m.from}:
                </span>{" "}
                <span className="chat-text">{m.text}</span>
              </p>
            ))
          )}
        </div>
      )}

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
