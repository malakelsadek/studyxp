import { useNameColorEquip } from "../game/useNameColorEquip";
import { USER_COLOR_PALETTE } from "../lib/userColor";

interface NameColorSettingProps {
  currentNameColor: string | null;
}

export function NameColorSetting({ currentNameColor }: NameColorSettingProps) {
  const equipNameColor = useNameColorEquip();
  const isPresetSelected = currentNameColor !== null && USER_COLOR_PALETTE.includes(currentNameColor);

  return (
    <div className="room-settings-section open">
      <div className="room-settings-section-header room-settings-section-header-static">
        <span className="room-settings-section-title">Name color</span>
      </div>
      <div className="room-settings-section-body">
        <div className="namecolor-picker">
          <button
            type="button"
            className={`namecolor-swatch namecolor-swatch-default ${currentNameColor === null ? "selected" : ""}`}
            onClick={() => equipNameColor(null)}
            title="Default"
          />
          {USER_COLOR_PALETTE.map((color) => (
            <button
              key={color}
              type="button"
              className={`namecolor-swatch ${currentNameColor === color ? "selected" : ""}`}
              style={{ backgroundColor: color }}
              onClick={() => equipNameColor(color)}
              title={color}
            />
          ))}
          <label
            className={`namecolor-wheel ${!isPresetSelected && currentNameColor !== null ? "selected" : ""}`}
            title="Pick a custom color"
            style={currentNameColor && !isPresetSelected ? { backgroundColor: currentNameColor } : undefined}
          >
            <input
              type="color"
              value={currentNameColor ?? "#ffffff"}
              onChange={(e) => equipNameColor(e.target.value)}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
