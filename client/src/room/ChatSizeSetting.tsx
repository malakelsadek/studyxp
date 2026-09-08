import { SettingsSection } from "./SettingsSection";
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
  const currentLabel = OPTIONS.find((opt) => opt.value === chatSize)?.label ?? "";
  return (
    <SettingsSection title="Chat text size" meta={currentLabel}>
      <div className="chat-size-options">
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
    </SettingsSection>
  );
}
