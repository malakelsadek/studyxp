import { useEffect, useId, useState, type FormEvent } from "react";

interface YoutubePanelProps {
  url: string | null;
  onSetUrl: (url: string | null) => void;
  canEdit: boolean;
}

function toUrl(raw: string): URL | null {
  try {
    return new URL(raw);
  } catch {
    // allow links copied without a protocol, e.g. "youtu.be/abc123"
    try {
      return new URL(`https://${raw}`);
    } catch {
      return null;
    }
  }
}

function youtubeEmbedUrl(videoId: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${encodeURIComponent(origin)}`;
}

interface ParsedYoutubeEmbed {
  embedUrl: string;
  videoId: string;
}

function parseYoutubeUrl(raw: string): ParsedYoutubeEmbed | null {
  const url = toUrl(raw.trim());
  if (!url) return null;
  const host = url.hostname.replace(/^www\.|^m\./, "");

  if (host === "youtube.com" || host === "music.youtube.com") {
    const videoId = url.searchParams.get("v");
    if (videoId) return { embedUrl: youtubeEmbedUrl(videoId), videoId };
    const pathMatch = /^\/(?:embed|shorts|live)\/([\w-]+)/.exec(url.pathname);
    if (pathMatch) return { embedUrl: youtubeEmbedUrl(pathMatch[1]), videoId: pathMatch[1] };
    return null;
  }
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0];
    return id ? { embedUrl: youtubeEmbedUrl(id), videoId: id } : null;
  }
  return null;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: { events?: { onError?: (event: { data: number }) => void } },
      ) => { destroy: () => void };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let youtubeApiPromise: Promise<void> | null = null;

function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();
  if (youtubeApiPromise) return youtubeApiPromise;

  youtubeApiPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    document.head.appendChild(script);
  });
  return youtubeApiPromise;
}

// Error codes YouTube's player reports when a video can't be played in an embed
// (owner disabled embedding, video removed/private, or bad id) — see IFrame API onError docs.
const UNPLAYABLE_ERROR_CODES = new Set([2, 5, 100, 101, 150]);

function YoutubeEmbed({ embedUrl, videoId }: { embedUrl: string; videoId?: string }) {
  const frameId = `yt-player-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let player: { destroy: () => void } | null = null;
    setBlocked(false);

    loadYoutubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;
      player = new window.YT.Player(frameId, {
        events: {
          onError: (event) => {
            if (UNPLAYABLE_ERROR_CODES.has(event.data)) setBlocked(true);
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [frameId, embedUrl]);

  if (blocked) {
    return (
      <div className="music-embed-blocked">
        <p>This video can't be played here — the owner has disabled embedding.</p>
        {videoId && (
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noreferrer">
            Watch on YouTube ↗
          </a>
        )}
      </div>
    );
  }

  return (
    <iframe
      id={frameId}
      key={embedUrl}
      src={embedUrl}
      title="Room YouTube player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}

export function YoutubePanel({ url, onSetUrl, canEdit }: YoutubePanelProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const parsed = url ? parseYoutubeUrl(url) : null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    const result = parseYoutubeUrl(draft.trim());
    if (!result) {
      setError("Paste a valid YouTube link.");
      return;
    }
    setError(null);
    onSetUrl(draft.trim());
    setDraft("");
  };

  return (
    <div className="music-panel">
      {parsed ? (
        <div className="music-embed-wrapper youtube">
          <YoutubeEmbed embedUrl={parsed.embedUrl} videoId={parsed.videoId} />
        </div>
      ) : (
        <p className="profile-muted">No video playing.</p>
      )}

      {canEdit ? (
        <form onSubmit={handleSubmit} className="music-form">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Paste a YouTube link..."
          />
          <button type="submit">Play</button>
        </form>
      ) : (
        <p className="profile-muted">Sign up to change the room's video.</p>
      )}
      {error && <p className="profile-error">{error}</p>}
      {url && canEdit && (
        <button type="button" className="music-clear" onClick={() => onSetUrl(null)}>
          Stop video
        </button>
      )}
    </div>
  );
}
