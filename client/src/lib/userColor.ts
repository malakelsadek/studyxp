// A small palette of bright, saturated colors that stay readable on both the
// dark translucent chat/name-tag backgrounds and the room's dark UI chrome.
// Keep in sync with server/src/users/nameColor.ts's NAME_COLOR_PALETTE.
export const USER_COLOR_PALETTE = [
  "#f87171", // red
  "#fb923c", // orange
  "#fbbf24", // amber
  "#4ade80", // green
  "#2dd4bf", // teal
  "#38bdf8", // sky
  "#818cf8", // indigo
  "#f472b6", // pink
  "#a78bfa", // purple
  "#facc15", // yellow
];

export function colorForUser(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return USER_COLOR_PALETTE[hash % USER_COLOR_PALETTE.length];
}
