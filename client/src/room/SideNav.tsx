export type PanelKey = "timer" | "todo" | "shortcuts";

interface SideNavProps {
  openPanels: Record<PanelKey, boolean>;
  onToggle: (panel: PanelKey) => void;
}

export function SideNav({ openPanels, onToggle }: SideNavProps) {
  return (
    <div className="side-nav">
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
        className={openPanels.shortcuts ? "active" : ""}
        title="Keyboard shortcuts"
        onClick={() => onToggle("shortcuts")}
      >
        ⌨️
      </button>
    </div>
  );
}
