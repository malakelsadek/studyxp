import { useEffect, useMemo } from "react";

interface CelebrationPopupProps {
  onDismiss: () => void;
}

const CONFETTI_COLORS = ["#4ade80", "#facc15", "#f87171", "#60a5fa", "#c084fc"];
const CONFETTI_COUNT = 36;
const AUTO_DISMISS_MS = 3500;

export function CelebrationPopup({ onDismiss }: CelebrationPopupProps) {
  useEffect(() => {
    const timeout = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timeout);
  }, [onDismiss]);

  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 1.8 + Math.random() * 1.2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.round(Math.random() * 360),
      })),
    [],
  );

  return (
    <div className="celebration-overlay" onClick={onDismiss}>
      <div className="confetti-layer">
        {pieces.map((p, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              background: p.color,
              transform: `rotate(${p.rotate}deg)`,
            }}
          />
        ))}
      </div>
      <div className="celebration-message">
        <div className="celebration-title">🎉 All tasks complete! 🎉</div>
        <div className="celebration-subtitle">Nice work.</div>
      </div>
    </div>
  );
}
