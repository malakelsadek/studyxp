import { getCharacterPreset, hexToCss } from "./characterPresets";

interface CharacterPreviewProps {
  characterId: string;
  size?: number;
}

const BASE = 40;

export function CharacterPreview({ characterId, size = 64 }: CharacterPreviewProps) {
  const preset = getCharacterPreset(characterId);
  const scale = size / BASE;

  return (
    <div style={{ width: size, height: size, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          left: 11 * scale,
          top: 18 * scale,
          width: 18 * scale,
          height: 16 * scale,
          background: hexToCss(preset.outfit),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 12 * scale,
          top: 6 * scale,
          width: 16 * scale,
          height: 14 * scale,
          background: hexToCss(preset.skin),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 11 * scale,
          top: 2 * scale,
          width: 18 * scale,
          height: 6 * scale,
          background: hexToCss(preset.hair),
        }}
      />
    </div>
  );
}
