export const CHARACTER_PRICE_COINS = 5;

export interface CharacterPreset {
  id: string;
  name: string;
  spriteUrl: string;
  price: number;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  { id: "char-1", name: "Prep", spriteUrl: "/assets/characters/char-1.png", price: 0 },
  { id: "char-2", name: "Uniform", spriteUrl: "/assets/characters/char-2.png", price: 0 },
  { id: "char-3", name: "Hoodie", spriteUrl: "/assets/characters/char-3.png", price: CHARACTER_PRICE_COINS },
  { id: "char-4", name: "Bookworm", spriteUrl: "/assets/characters/char-4.png", price: CHARACTER_PRICE_COINS },
  { id: "char-5", name: "Scholar", spriteUrl: "/assets/characters/char-5.png", price: CHARACTER_PRICE_COINS },
  { id: "char-6", name: "Hijabi", spriteUrl: "/assets/characters/char-6.png", price: CHARACTER_PRICE_COINS },
];

export const FREE_CHARACTER_IDS = CHARACTER_PRESETS.filter((c) => c.price === 0).map((c) => c.id);

export const DEFAULT_CHARACTER_ID = CHARACTER_PRESETS[0].id;

export function getCharacterPreset(id: string): CharacterPreset {
  return CHARACTER_PRESETS.find((c) => c.id === id) ?? CHARACTER_PRESETS[0];
}
