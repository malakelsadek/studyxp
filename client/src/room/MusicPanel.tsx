import { useState, type FormEvent } from "react";

interface MusicPanelProps {
  musicUrl: string | null;
  onSetMusic: (url: string | null) => void;
  canEdit: boolean;
}

function toUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    // allow links copied without a protocol, e.g. "open.spotify.com/track/abc123"
    try {
      return new URL(`https://${raw}`);
    } catch {
      return null;
    }
  }
}

interface ParsedSpotifyEmbed {
  embedUrl: string;
  // playlists and albums show a track list and need more vertical room than a single track/episode
  expanded: boolean;
}

function parseSpotifyEmbed(raw: string): ParsedSpotifyEmbed | null {
  const url = toUrl(raw.trim());
  if (!url) return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host !== "open.spotify.com") return null;

  // Spotify share links copied outside the US often carry a locale prefix, e.g. /intl-de/track/...
  // Legacy playlist links look like /user/<username>/playlist/<id> instead.
  const match =
    /^\/(?:intl-[a-zA-Z]{2}\/)?(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/.exec(url.pathname) ??
    /^\/user\/[^/]+\/(playlist)\/([a-zA-Z0-9]+)/.exec(url.pathname);
  if (!match) return null;
  const [, kind, id] = match;
  return {
    embedUrl: `https://open.spotify.com/embed/${kind}/${id}?autoplay=1`,
    expanded: kind === "album" || kind === "playlist",
  };
}

export function MusicPanel({ musicUrl, onSetMusic, canEdit }: MusicPanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = musicUrl ? parseSpotifyEmbed(musicUrl) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const result = parseSpotifyEmbed(draft.trim());
    if (!result) {
      setError("Paste a valid Spotify link.");
      return;
    }
    setError(null);
    onSetMusic(draft.trim());
    setDraft("");
  };

  return (
    <div className="music-panel">
      {parsed ? (
        <div className={parsed.expanded ? "music-embed-wrapper spotify expanded" : "music-embed-wrapper spotify"}>
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
            placeholder="Paste a Spotify link..."
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
