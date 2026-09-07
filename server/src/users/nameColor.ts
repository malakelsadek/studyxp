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

export function isValidNameColor(color: unknown): color is string {
  return typeof color === "string" && (NAME_COLOR_PALETTE as readonly string[]).includes(color);
}
