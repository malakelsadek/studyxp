import { CHARACTER_PRESETS } from "../game/characterPresets";
import { CharacterPreview } from "../game/CharacterPreview";
import { useCharacterEquip } from "../game/useCharacterEquip";

interface OutfitPanelProps {
  currentCharacter: string;
}

export function OutfitPanel({ currentCharacter }: OutfitPanelProps) {
  const equipCharacter = useCharacterEquip();

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
    </div>
  );
}
