interface ActivityHeatmapProps {
  heatmap: Array<{ date: string; durationMs: number }>;
}

const LEVEL_COLORS = ["#2a2a3d", "#104281", "#256abf", "#5598e7", "#b7d3f6"];

function levelFor(durationMs: number): number {
  if (durationMs <= 0) return 0;
  if (durationMs < 15 * 60 * 1000) return 1;
  if (durationMs < 30 * 60 * 1000) return 2;
  if (durationMs < 60 * 60 * 1000) return 3;
  return 4;
}

function formatTooltip(date: string, durationMs: number): string {
  if (durationMs <= 0) return `${date}: no study time`;
  const minutes = Math.round(durationMs / 60000);
  return `${date}: ${minutes} min`;
}

export function ActivityHeatmap({ heatmap }: ActivityHeatmapProps) {
  const weeks: Array<typeof heatmap> = [];
  for (let i = 0; i < heatmap.length; i += 7) {
    weeks.push(heatmap.slice(i, i + 7));
  }

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {weeks.map((week, wi) => (
          <div className="heatmap-column" key={wi}>
            {week.map((day) => (
              <div
                key={day.date}
                className="heatmap-cell"
                style={{ background: LEVEL_COLORS[levelFor(day.durationMs)] }}
                title={formatTooltip(day.date, day.durationMs)}
              />
            ))}
          </div>
        ))}
      </div>
      <div className="heatmap-legend">
        <span>Less</span>
        {LEVEL_COLORS.map((color) => (
          <span key={color} className="heatmap-swatch" style={{ background: color }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
