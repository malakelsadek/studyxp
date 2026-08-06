export const CHARACTER_IDS = ["char-1", "char-2", "char-3", "char-4", "char-5", "char-6"] as const;

export const ALL_CHARACTER_IDS: string[] = [...CHARACTER_IDS];

export function isKnownCharacter(id: string): boolean {
  return (CHARACTER_IDS as readonly string[]).includes(id);
}
