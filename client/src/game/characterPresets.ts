export interface CharacterPreset {
  id: string;
  name: string;
  spriteUrl: string;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  { id: "char-1", name: "Prep", spriteUrl: "/assets/characters/char-1.png" },
  { id: "char-2", name: "Uniform", spriteUrl: "/assets/characters/char-2.png" },
  { id: "char-3", name: "Hoodie", spriteUrl: "/assets/characters/char-3.png" },
  { id: "char-4", name: "Bookworm", spriteUrl: "/assets/characters/char-4.png" },
  { id: "char-5", name: "Scholar", spriteUrl: "/assets/characters/char-5.png" },
  { id: "char-6", name: "Hijabi", spriteUrl: "/assets/characters/char-6.png" },
];

export const DEFAULT_CHARACTER_ID = CHARACTER_PRESETS[0].id;

export function getCharacterPreset(id: string): CharacterPreset {
  return CHARACTER_PRESETS.find((c) => c.id === id) ?? CHARACTER_PRESETS[0];
}
