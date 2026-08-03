import Phaser from "phaser";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function colorForPlayerId(id: string): number {
  const hue = hashString(id) % 360;
  return Phaser.Display.Color.HSLToColor(hue / 360, 0.65, 0.55).color;
}
