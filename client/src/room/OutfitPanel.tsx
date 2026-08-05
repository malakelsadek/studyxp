import { CHARACTER_PRESETS } from "../game/characterPresets";
import { CharacterPreview } from "../game/CharacterPreview";
import { useCharacterEquip } from "../game/useCharacterEquip";

interface OutfitPanelProps {
  currentCharacter: string;
  ownedCharacters: string[];
}

export function OutfitPanel({ currentCharacter, ownedCharacters }: OutfitPanelProps) {
  const equipCharacter = useCharacterEquip();
  const owned = CHARACTER_PRESETS.filter((preset) => ownedCharacters.includes(preset.id));

  return (
    <div>
      <div className="outfit-grid">
        {owned.map((preset) => (
          <button
            key={preset.id}
            className={`outfit-option ${currentCharacter === preset.id ? "selected" : ""}`}
            onClick={() => equipCharacter(preset.id)}
          >
            <CharacterPreview characterId={preset.id} size={56} />
            <span>{preset.name}</span>
          </button>
        ))}
      </div>
      {owned.length < CHARACTER_PRESETS.length && (
        <p className="profile-muted outfit-hint">More outfits are available in the Home store.</p>
      )}
    </div>
  );
}
