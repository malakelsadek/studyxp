const SHORTCUTS: Array<{ keys: string; description: string }> = [
  { keys: "Alt + C", description: "Open chat and start typing" },
  { keys: "Esc", description: "Close chat" },
  { keys: "Alt + T", description: "Toggle timer" },
  { keys: "Alt + D", description: "Toggle to-do list" },
  { keys: "Alt + B", description: "Toggle calendar" },
  { keys: "Alt + P", description: "Toggle people panel" },
  { keys: "Alt + M", description: "Toggle music" },
];

export function ShortcutsPanel() {
  return (
    <ul className="shortcuts-list">
      {SHORTCUTS.map((s) => (
        <li key={s.keys}>
          <kbd>{s.keys}</kbd>
          <span>{s.description}</span>
        </li>
      ))}
    </ul>
  );
}
