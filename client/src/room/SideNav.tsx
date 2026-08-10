export type PanelKey =
  | "settings"
  | "shortcuts"
  | "timer"
  | "todo"
  | "calendar"
  | "youtube"
  | "spotify"
  | "outfit"
  | "people";

interface SideNavProps {
  openPanels: Record<PanelKey, boolean>;
  onToggle: (panel: PanelKey) => void;
}

export function SideNav({ openPanels, onToggle }: SideNavProps) {
  return (
    <div className="side-nav">
      <button
        className={openPanels.settings ? "active" : ""}
        title="Room settings"
        onClick={() => onToggle("settings")}
      >
        ⚙️
      </button>
      <button
        className={openPanels.shortcuts ? "active" : ""}
        title="Keyboard shortcuts"
        onClick={() => onToggle("shortcuts")}
      >
        ⌨️
      </button>
      <button
        className={openPanels.timer ? "active" : ""}
        title="Timer (Alt+T)"
        onClick={() => onToggle("timer")}
      >
        ⏱️
      </button>
      <button
        className={openPanels.todo ? "active" : ""}
        title="To-do list (Alt+D)"
        onClick={() => onToggle("todo")}
      >
        📝
      </button>
      <button
        className={openPanels.calendar ? "active" : ""}
        title="Calendar (Alt+B)"
        onClick={() => onToggle("calendar")}
      >
        🗓️
      </button>
      <button
        className={openPanels.youtube ? "active" : ""}
        title="YouTube (Alt+Y)"
        onClick={() => onToggle("youtube")}
      >
        📺
      </button>
      <button
        className={openPanels.spotify ? "active" : ""}
        title="Spotify (Alt+S)"
        onClick={() => onToggle("spotify")}
      >
        🎵
      </button>
      <button
        className={openPanels.outfit ? "active" : ""}
        title="Change outfit"
        onClick={() => onToggle("outfit")}
      >
        👕
      </button>
    </div>
  );
}
