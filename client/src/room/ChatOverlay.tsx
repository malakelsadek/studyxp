import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage } from "../socket/types";
import { colorForUser } from "../lib/userColor";
import { flagEmoji } from "../profile/countries";
import type { ChatSize } from "./useChatSizePreference";

function formatTime(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

interface ChatOverlayProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  active: boolean;
  showMessages: boolean;
  onToggleMessages: () => void;
  locked?: boolean;
  size?: ChatSize;
  showFlags?: boolean;
}

export function ChatOverlay({
  messages,
  onSend,
  active,
  showMessages,
  onToggleMessages,
  locked,
  size = "medium",
  showFlags = true,
}: ChatOverlayProps) {
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
    if (locked || !text.trim()) return;
    onSend(text.trim());
    setText("");
  };

  return (
    <div className={`chat-overlay chat-overlay--${size}`} onMouseDown={(e) => e.stopPropagation()}>
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
                  {m.country && showFlags && <span className="chat-flag">{flagEmoji(m.country)}</span>}
                  {m.from}:
                </span>{" "}
                <span className="chat-text">{m.text}</span>
              </p>
            ))
          )}
        </div>
      )}

      {locked && <p className="chat-overlay-locked">Chat is paused while the shared timer is running.</p>}

      {active && !locked && (
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
