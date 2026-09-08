import { PRAYER_CALCULATION_METHODS, type PrayerCalculationMethod, type PrayerMadhab } from "./prayerTimes";
import { SettingsSection } from "./SettingsSection";

interface PrayerTimesSettingProps {
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  method: PrayerCalculationMethod;
  onMethodChange: (value: PrayerCalculationMethod) => void;
  madhab: PrayerMadhab;
  onMadhabChange: (value: PrayerMadhab) => void;
  hasCoordinates: boolean;
  locating: boolean;
  locationError: string | null;
  onRequestLocation: () => void;
}

export function PrayerTimesSetting({
  enabled,
  onEnabledChange,
  method,
  onMethodChange,
  madhab,
  onMadhabChange,
  hasCoordinates,
  locating,
  locationError,
  onRequestLocation,
}: PrayerTimesSettingProps) {
  return (
    <SettingsSection title="Prayer times" meta={enabled ? "On" : "Off"}>
      <label className="room-settings-toggle">
        <input type="checkbox" checked={enabled} onChange={(e) => onEnabledChange(e.target.checked)} />
        Show prayer times and reminders
      </label>
      <p className="profile-muted">
        Optional and personal — only affects your own view. When a prayer's time arrives, your
        screen locks with a reminder and your personal timer pauses until you check "I prayed".
      </p>

      {enabled && (
        <>
          <label className="prayer-method-picker">
            <span>Calculation method</span>
            <select value={method} onChange={(e) => onMethodChange(e.target.value as PrayerCalculationMethod)}>
              {PRAYER_CALCULATION_METHODS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="room-settings-toggle">
            <input
              type="radio"
              name="prayer-madhab"
              checked={madhab === "Shafi"}
              onChange={() => onMadhabChange("Shafi")}
            />
            Shafi/Maliki/Hanbali (Asr)
          </label>
          <label className="room-settings-toggle">
            <input
              type="radio"
              name="prayer-madhab"
              checked={madhab === "Hanafi"}
              onChange={() => onMadhabChange("Hanafi")}
            />
            Hanafi (Asr)
          </label>

          <div className="room-settings-row">
            <span className="profile-muted">{hasCoordinates ? "Location set" : "Location not set"}</span>
            <button type="button" onClick={onRequestLocation} disabled={locating}>
              {locating ? "Locating..." : hasCoordinates ? "Update location" : "Share my location"}
            </button>
          </div>
          {locationError && <p className="profile-error">{locationError}</p>}
        </>
      )}
    </SettingsSection>
  );
}
