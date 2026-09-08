import { YoutubePanel } from "./YoutubePanel";
import { SpotifyPanel } from "./SpotifyPanel";

export type MediaTab = "youtube" | "spotify";

interface MediaTileProps {
  tab: MediaTab;
  onTabChange: (tab: MediaTab) => void;
  youtubeUrl: string | null;
  onSetYoutubeUrl: (url: string | null) => void;
  spotifyUrl: string | null;
  onSetSpotifyUrl: (url: string | null) => void;
  canEdit: boolean;
}

export function MediaTile({
  tab,
  onTabChange,
  youtubeUrl,
  onSetYoutubeUrl,
  spotifyUrl,
  onSetSpotifyUrl,
  canEdit,
}: MediaTileProps) {
  return (
    <div>
      <div className="media-tabs">
        <button className={tab === "youtube" ? "active" : ""} onClick={() => onTabChange("youtube")}>
          YouTube
        </button>
        <button className={tab === "spotify" ? "active" : ""} onClick={() => onTabChange("spotify")}>
          Spotify
        </button>
      </div>
      {/* Both panels stay mounted (just hidden) so the embed that's already loaded keeps
          playing in the background when you switch tabs, instead of tearing down the iframe. */}
      <div hidden={tab !== "youtube"}>
        <YoutubePanel url={youtubeUrl} onSetUrl={onSetYoutubeUrl} canEdit={canEdit} />
      </div>
      <div hidden={tab !== "spotify"}>
        <SpotifyPanel url={spotifyUrl} onSetUrl={onSetSpotifyUrl} canEdit={canEdit} />
      </div>
    </div>
  );
}
