import { useState, type ReactNode } from "react";

interface SettingsSectionProps {
  title: string;
  meta?: string;
  children: ReactNode;
  // Omit isOpen/onToggle to let the section manage its own open/closed state
  // (used by standalone settings like chat size / name color); pass both to
  // make it controlled (used by RoomSettings so only one section is open at once).
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SettingsSection({ title, meta, children, isOpen: controlledOpen, onToggle }: SettingsSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const toggle = onToggle ?? (() => setUncontrolledOpen((prev) => !prev));

  return (
    <div className={`room-settings-section${isOpen ? " open" : ""}`}>
      <button type="button" className="room-settings-section-header" onClick={toggle}>
        <span className="room-settings-section-chevron">▸</span>
        <span className="room-settings-section-title">{title}</span>
        {meta && <span className="room-settings-section-meta">{meta}</span>}
      </button>
      {isOpen && <div className="room-settings-section-body">{children}</div>}
    </div>
  );
}
