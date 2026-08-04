import { getCharacterPreset } from "./characterPresets";

interface CharacterPreviewProps {
  characterId: string;
  size?: number;
}

export function CharacterPreview({ characterId, size = 64 }: CharacterPreviewProps) {
  const preset = getCharacterPreset(characterId);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
      }}
    >
      <img
        src={preset.spriteUrl}
        alt={preset.name}
        style={{
          height: "100%",
          width: "auto",
          maxWidth: "100%",
          objectFit: "contain",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
}
