import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { CHARACTER_PRESETS } from "../game/characterPresets";
import { CharacterPreview } from "../game/CharacterPreview";
import { useCharacterEquip } from "../game/useCharacterEquip";
import { purchaseCharacter } from "../lib/api";

export function CharacterStore() {
  const { user, token, applyPurchase } = useAuth();
  const equipCharacter = useCharacterEquip();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const handleBuy = async (characterId: string) => {
    if (!token) {
      setError("Sign up for an account to unlock more outfits.");
      return;
    }
    setError(null);
    setPendingId(characterId);
    try {
      const { ownedCharacters, coins } = await purchaseCharacter(token, characterId);
      applyPurchase(ownedCharacters, coins);
      equipCharacter(characterId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div>
      <div className="coin-balance">🪙 {user.coins} coins</div>
      {error && <p className="dashboard-error">{error}</p>}
      <div className="character-grid">
        {CHARACTER_PRESETS.map((preset) => {
          const owned = user.ownedCharacters.includes(preset.id);
          const isSelected = user.character === preset.id;
          const canAfford = token != null && user.coins >= preset.price;
          return (
            <button
              key={preset.id}
              className={`character-option ${isSelected ? "selected" : ""} ${!owned ? "locked" : ""}`}
              disabled={pendingId === preset.id || (!owned && !canAfford)}
              onClick={() => (owned ? equipCharacter(preset.id) : handleBuy(preset.id))}
            >
              <CharacterPreview characterId={preset.id} size={56} />
              <span>{preset.name}</span>
              {!owned && <span className="character-price">{preset.price} coins</span>}
              {owned && isSelected && <span className="character-equipped">Equipped</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
