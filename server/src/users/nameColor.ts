// Keep in sync with client/src/lib/userColor.ts's USER_COLOR_PALETTE.
export const NAME_COLOR_PALETTE = [
  "#f87171",
  "#fb923c",
  "#fbbf24",
  "#4ade80",
  "#2dd4bf",
  "#38bdf8",
  "#818cf8",
  "#f472b6",
  "#a78bfa",
  "#facc15",
] as const;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

// Any valid hex color is accepted (not just the preset palette) so a color-wheel
// pick persists — it's a cosmetic display color with no security implication.
export function isValidNameColor(color: unknown): color is string {
  return typeof color === "string" && HEX_COLOR_PATTERN.test(color);
}
