export type CharacterPose = "still" | "up" | "down" | "left" | "right";

export interface CharacterPreset {
  id: string;
  name: string;
  spriteUrl: string;
  sprites: Record<CharacterPose, string>;
}

function characterSprites(id: string): Record<CharacterPose, string> {
  return {
    still: `/assets/characters/${id}-still.png`,
    up: `/assets/characters/${id}-up.png`,
    down: `/assets/characters/${id}-down.png`,
    left: `/assets/characters/${id}-left.png`,
    right: `/assets/characters/${id}-right.png`,
  };
}

function preset(id: string, name: string): CharacterPreset {
  const sprites = characterSprites(id);
  return { id, name, sprites, spriteUrl: sprites.still };
}

export const CHARACTER_PRESETS: CharacterPreset[] = [
  preset("char-1", "Buns"),
  preset("char-2", "Wavy"),
  preset("char-3", "Curls"),
  preset("char-4", "Specs"),
  preset("char-5", "Scholar"),
  preset("char-6", "Bookworm"),
];

export const ALL_CHARACTER_IDS = CHARACTER_PRESETS.map((c) => c.id);

export const DEFAULT_CHARACTER_ID = CHARACTER_PRESETS[0].id;

export function getCharacterPreset(id: string): CharacterPreset {
  return CHARACTER_PRESETS.find((c) => c.id === id) ?? CHARACTER_PRESETS[0];
}
