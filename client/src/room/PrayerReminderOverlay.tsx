import { useEffect, useRef, useState } from "react";
import { playSadSound } from "./timerSounds";

const SKIP_DISMISS_DELAY_MS = 5000;

interface PrayerReminderOverlayProps {
  prayerName: string;
  onMarkPrayed: () => void;
  onSkip: () => void;
}

export function PrayerReminderOverlay({ prayerName, onMarkPrayed, onSkip }: PrayerReminderOverlayProps) {
  const [skipping, setSkipping] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSkip = () => {
    setSkipping(true);
    playSadSound();
    timeoutRef.current = setTimeout(onSkip, SKIP_DISMISS_DELAY_MS);
  };

  return (
    <div className="prayer-reminder-overlay">
      <div className="prayer-reminder-card">
        {skipping ? (
          <>
            <div className="prayer-reminder-icon">😞</div>
            <h2>Maybe next time...</h2>
            <p className="profile-muted">Try not to skip {prayerName} again.</p>
          </>
        ) : (
          <>
            <div className="prayer-reminder-icon">🕌</div>
            <h2>Time for {prayerName}</h2>
            <p className="profile-muted">
              Your timers are paused. Take a moment to pray, then check in below to continue.
            </p>
            <div className="prayer-reminder-actions">
              <button type="button" className="prayer-reminder-confirm" onClick={onMarkPrayed}>
                I prayed
              </button>
              <button type="button" className="prayer-reminder-skip" onClick={handleSkip}>
                Skip <span aria-hidden="true">😢</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
