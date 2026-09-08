import type { PrayerChecklistItem } from "./usePrayerReminder";
import type { PrayerName } from "./prayerTimes";

interface PrayerTimesTileProps {
  hasCoordinates: boolean;
  locating: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
  checklist: PrayerChecklistItem[];
  nextPrayer: PrayerChecklistItem | null;
  onTogglePrayed: (name: PrayerName, prayed: boolean) => void;
}

function formatClock(date: Date): string {
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function PrayerTimesTile({
  hasCoordinates,
  locating,
  locationError,
  onRequestLocation,
  checklist,
  nextPrayer,
  onTogglePrayed,
}: PrayerTimesTileProps) {
  if (!hasCoordinates) {
    return (
      <div className="prayer-tile">
        <p className="profile-muted">Prayer times need your location to calculate accurately.</p>
        <button type="button" onClick={onRequestLocation} disabled={locating}>
          {locating ? "Locating..." : "Share my location"}
        </button>
        {locationError && <p className="profile-error">{locationError}</p>}
      </div>
    );
  }

  return (
    <div className="prayer-tile">
      {nextPrayer ? (
        <div className="prayer-next">
          <span className="prayer-next-label">Next</span>
          <span className="prayer-next-name">{nextPrayer.name}</span>
          <span className="prayer-next-time">{formatClock(nextPrayer.time)}</span>
        </div>
      ) : (
        <p className="profile-muted">All of today's prayers have passed.</p>
      )}

      <ul className="prayer-checklist">
        {checklist.map((item) => (
          <li key={item.name} className={item.prayed ? "done" : item.skipped ? "skipped" : ""}>
            <label>
              <input
                type="checkbox"
                checked={item.prayed}
                onChange={(e) => onTogglePrayed(item.name, e.target.checked)}
              />
              <span className="prayer-checklist-name">{item.name}</span>
              {item.skipped && (
                <span className="prayer-checklist-skipped" title="Skipped" aria-hidden="true">
                  😢
                </span>
              )}
            </label>
            <span className="prayer-checklist-time">{formatClock(item.time)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
