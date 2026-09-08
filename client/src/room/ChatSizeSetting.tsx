import type { ChatSize } from "./useChatSizePreference";

interface ChatSizeSettingProps {
  chatSize: ChatSize;
  onChange: (size: ChatSize) => void;
}

const OPTIONS: Array<{ value: ChatSize; label: string }> = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export function ChatSizeSetting({ chatSize, onChange }: ChatSizeSettingProps) {
  return (
    <div className="chat-size-setting">
      <span className="chat-size-setting-label">Chat text size</span>
      <div className="chat-size-setting-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={chatSize === opt.value ? "active" : ""}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
