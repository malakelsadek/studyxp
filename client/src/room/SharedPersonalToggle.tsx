export type ViewMode = "shared" | "personal";

interface SharedPersonalToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function SharedPersonalToggle({ mode, onChange }: SharedPersonalToggleProps) {
  const isShared = mode === "shared";

  return (
    <label className="mode-switch">
      <span className={!isShared ? "active" : ""}>Personal</span>
      <input
        type="checkbox"
        checked={isShared}
        onChange={() => onChange(isShared ? "personal" : "shared")}
      />
      <span className="switch-slider" />
      <span className={isShared ? "active" : ""}>Shared</span>
    </label>
  );
}
