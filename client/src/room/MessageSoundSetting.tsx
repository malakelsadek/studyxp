import { MESSAGE_SOUND_OPTIONS } from "./messageSounds";
import { SettingsSection } from "./SettingsSection";

interface MessageSoundSettingProps {
  soundId: string;
  onChange: (id: string) => void;
}

export function MessageSoundSetting({ soundId, onChange }: MessageSoundSettingProps) {
  const currentLabel = MESSAGE_SOUND_OPTIONS.find((opt) => opt.id === soundId)?.name ?? "";
  return (
    <SettingsSection title="Message sound" meta={currentLabel}>
      <label className="timer-sound-picker">
        <span>Sound when a message arrives</span>
        <select value={soundId} onChange={(e) => onChange(e.target.value)}>
          {MESSAGE_SOUND_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </label>
    </SettingsSection>
  );
}
