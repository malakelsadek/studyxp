import { useAuth } from "../auth/AuthContext";
import { CHARACTER_PRESETS } from "../game/characterPresets";
import { CharacterPreview } from "../game/CharacterPreview";
import { useCharacterEquip } from "../game/useCharacterEquip";

export function CharacterStore() {
  const { user } = useAuth();
  const equipCharacter = useCharacterEquip();

  if (!user) return null;

  return (
    <div className="character-grid">
      {CHARACTER_PRESETS.map((preset) => {
        const isSelected = user.character === preset.id;
        return (
          <button
            key={preset.id}
            className={`character-option ${isSelected ? "selected" : ""}`}
            onClick={() => equipCharacter(preset.id)}
          >
            <CharacterPreview characterId={preset.id} size={56} />
            <span>{preset.name}</span>
            {isSelected && <span className="character-equipped">Equipped</span>}
          </button>
        );
      })}
    </div>
  );
}
