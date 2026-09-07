import { CHARACTER_PRESETS } from "../game/characterPresets";
import { CharacterPreview } from "../game/CharacterPreview";
import { useCharacterEquip } from "../game/useCharacterEquip";
import { useNameColorEquip } from "../game/useNameColorEquip";
import { USER_COLOR_PALETTE } from "../lib/userColor";

interface OutfitPanelProps {
  currentCharacter: string;
  currentNameColor: string | null;
}

export function OutfitPanel({ currentCharacter, currentNameColor }: OutfitPanelProps) {
  const equipCharacter = useCharacterEquip();
  const equipNameColor = useNameColorEquip();

  return (
    <div className="outfit-grid-scroll">
      <div className="outfit-grid">
        {CHARACTER_PRESETS.map((preset) => {
          const isSelected = currentCharacter === preset.id;
          return (
            <button
              key={preset.id}
              className={`outfit-option ${isSelected ? "selected" : ""}`}
              onClick={() => equipCharacter(preset.id)}
            >
              <CharacterPreview characterId={preset.id} size={56} />
              <span>{preset.name}</span>
              {isSelected && <span className="character-equipped">Equipped</span>}
            </button>
          );
        })}
      </div>

      <h3 className="outfit-section-title">Name color</h3>
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
      </div>
    </div>
  );
}
