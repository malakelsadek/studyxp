import { SettingsSection } from "./SettingsSection";

interface ShowChatFlagsSettingProps {
  showChatFlags: boolean;
  onChange: (value: boolean) => void;
}

export function ShowChatFlagsSetting({ showChatFlags, onChange }: ShowChatFlagsSettingProps) {
  return (
    <SettingsSection title="Chat country flags" meta={showChatFlags ? "On" : "Off"}>
      <label className="room-settings-toggle">
        <input type="checkbox" checked={showChatFlags} onChange={(e) => onChange(e.target.checked)} />
        Show country flags next to names in chat
      </label>
    </SettingsSection>
  );
}
