import { SettingsSection } from "./SettingsSection";
import type { ChatSize } from "./useChatSizePreference";

interface ChatSizeSettingProps {
  chatSize: ChatSize;
  onChange: (size: ChatSize) => void;
}

const SIZES: ChatSize[] = ["small", "medium", "large"];
const LABELS: Record<ChatSize, string> = { small: "Small", medium: "Medium", large: "Large" };

export function ChatSizeSetting({ chatSize, onChange }: ChatSizeSettingProps) {
  const index = SIZES.indexOf(chatSize);

  return (
    <SettingsSection title="Chat text size" meta={LABELS[chatSize]}>
      <div className="chat-size-slider">
        <input
          type="range"
          min={0}
          max={SIZES.length - 1}
          step={1}
          value={index}
          onChange={(e) => onChange(SIZES[Number(e.target.value)])}
        />
        <div className="chat-size-slider-labels">
          {SIZES.map((size) => (
            <span key={size} className={size === chatSize ? "active" : ""}>
              {LABELS[size]}
            </span>
          ))}
        </div>
      </div>
    </SettingsSection>
  );
}
