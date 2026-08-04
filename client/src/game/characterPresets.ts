export interface CharacterPreset {
  id: string;
  name: string;
  skin: number;
  hair: number;
  outfit: number;
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  { id: "char-1", name: "Sunny", skin: 0xffdbac, hair: 0x4a2c17, outfit: 0xef4444 },
  { id: "char-2", name: "Mossy", skin: 0xe8b48c, hair: 0x1a1a1a, outfit: 0x22c55e },
  { id: "char-3", name: "Skye", skin: 0xffdbac, hair: 0xf5d442, outfit: 0x3b82f6 },
  { id: "char-4", name: "Berry", skin: 0xc68863, hair: 0x8b3a3a, outfit: 0xa855f7 },
  { id: "char-5", name: "Frost", skin: 0xf1c27d, hair: 0xe0e0e0, outfit: 0x06b6d4 },
  { id: "char-6", name: "Ember", skin: 0x8d5524, hair: 0x2b2b2b, outfit: 0xf97316 },
];

export const DEFAULT_CHARACTER_ID = CHARACTER_PRESETS[0].id;

export function getCharacterPreset(id: string): CharacterPreset {
  return CHARACTER_PRESETS.find((c) => c.id === id) ?? CHARACTER_PRESETS[0];
}

export function hexToCss(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}
