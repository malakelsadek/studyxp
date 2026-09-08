export type PanelKey =
  | "settings"
  | "shortcuts"
  | "timer"
  | "todo"
  | "calendar"
  | "media"
  | "outfit"
  | "people"
  | "prayer";

interface SideNavProps {
  openPanels: Record<PanelKey, boolean>;
  onToggle: (panel: PanelKey) => void;
  showPrayerButton?: boolean;
}

export function SideNav({ openPanels, onToggle, showPrayerButton }: SideNavProps) {
  return (
    <div className="side-nav" onMouseDown={(e) => e.stopPropagation()}>
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
        className={openPanels.media ? "active" : ""}
        title="Media: YouTube & Spotify (Alt+Y / Alt+S)"
        onClick={() => onToggle("media")}
      >
        🎬
      </button>
      <button
        className={openPanels.outfit ? "active" : ""}
        title="Change outfit"
        onClick={() => onToggle("outfit")}
      >
        👕
      </button>
      {showPrayerButton && (
        <button
          className={openPanels.prayer ? "active" : ""}
          title="Prayer times"
          onClick={() => onToggle("prayer")}
        >
          🕌
        </button>
      )}
    </div>
  );
}
