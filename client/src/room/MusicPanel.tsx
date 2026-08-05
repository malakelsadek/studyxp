import { useState, type FormEvent } from "react";

interface MusicPanelProps {
  musicUrl: string | null;
  onSetMusic: (url: string | null) => void;
  canEdit: boolean;
}

interface ParsedEmbed {
  kind: "youtube" | "spotify";
  embedUrl: string;
}

function parseMusicUrl(raw: string): ParsedEmbed | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com") {
    const videoId = url.searchParams.get("v");
    if (videoId) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${videoId}` };
    const embedMatch = /^\/embed\/([\w-]+)/.exec(url.pathname);
    if (embedMatch) return { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${embedMatch[1]}` };
    return null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? { kind: "youtube", embedUrl: `https://www.youtube.com/embed/${id}` } : null;
  }
  if (host === "open.spotify.com") {
    const match = /^\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/.exec(url.pathname);
    return match ? { kind: "spotify", embedUrl: `https://open.spotify.com/embed/${match[1]}/${match[2]}` } : null;
  }
  return null;
}

export function MusicPanel({ musicUrl, onSetMusic, canEdit }: MusicPanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = musicUrl ? parseMusicUrl(musicUrl) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const result = parseMusicUrl(draft.trim());
    if (!result) {
      setError("Paste a valid YouTube or Spotify link.");
      return;
    }
    setError(null);
    onSetMusic(draft.trim());
    setDraft("");
  };

  return (
    <div className="music-panel">
      {parsed ? (
        <div className={parsed.kind === "spotify" ? "music-embed-wrapper spotify" : "music-embed-wrapper youtube"}>
          <iframe
            key={parsed.embedUrl}
            src={parsed.embedUrl}
            title="Room music player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="profile-muted">No music playing.</p>
      )}

      {canEdit ? (
        <form onSubmit={handleSubmit} className="music-form">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste a YouTube or Spotify link..."
          />
          <button type="submit">Play</button>
        </form>
      ) : (
        <p className="profile-muted">Sign up to change the room's music.</p>
      )}
      {error && <p className="profile-error">{error}</p>}
      {musicUrl && canEdit && (
        <button type="button" className="music-clear" onClick={() => onSetMusic(null)}>
          Stop music
        </button>
      )}
    </div>
  );
}
