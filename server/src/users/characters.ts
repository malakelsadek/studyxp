export const CHARACTER_IDS = ["char-1", "char-2", "char-3", "char-4", "char-5", "char-6"] as const;

export const FREE_CHARACTER_IDS = ["char-1", "char-2"];

export const CHARACTER_PRICE_COINS = 5;

export function isKnownCharacter(id: string): boolean {
  return (CHARACTER_IDS as readonly string[]).includes(id);
}

export function getCharacterPrice(id: string): number {
  return FREE_CHARACTER_IDS.includes(id) ? 0 : CHARACTER_PRICE_COINS;
}
