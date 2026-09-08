interface HeatmapDay {
  date: string;
  durationMs: number;
}

interface ActivityHeatmapProps {
  heatmap: HeatmapDay[];
}

const LEVEL_COLORS = ["transparent", "#104281", "#256abf", "#5598e7", "#b7d3f6"];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function monthOf(date: string): number {
  return Number(date.slice(5, 7)) - 1;
}

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

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function ActivityHeatmap({ heatmap }: ActivityHeatmapProps) {
  // Pad the first column so every row lines up with its real weekday (Sun..Sat),
  // GitHub-contribution-graph style, instead of just chunking dates into blocks of 7.
  const columns: Array<Array<HeatmapDay | null>> = [];
  if (heatmap.length > 0) {
    let column: Array<HeatmapDay | null> = new Array(weekdayOf(heatmap[0].date)).fill(null);
    for (const day of heatmap) {
      column.push(day);
      if (column.length === 7) {
        columns.push(column);
        column = [];
      }
    }
    if (column.length > 0) {
      while (column.length < 7) column.push(null);
      columns.push(column);
    }
  }

  // Label a column with its month name only when that month first appears, so each
  // month is stamped once above the week it starts in (GitHub-contribution-graph style).
  const monthLabels: string[] = [];
  let lastMonth = -1;
  for (const column of columns) {
    const firstDay = column.find((day): day is HeatmapDay => day !== null);
    const month = firstDay ? monthOf(firstDay.date) : lastMonth;
    if (firstDay && month !== lastMonth) {
      monthLabels.push(MONTH_LABELS[month]);
      lastMonth = month;
    } else {
      monthLabels.push("");
    }
  }

  return (
    <div className="heatmap">
      <div className="heatmap-title">Activity</div>
      <div className="heatmap-month-labels">
        {monthLabels.map((label, i) => (
          <span key={i}>{label}</span>
        ))}
      </div>
      <div className="heatmap-body">
        <div className="heatmap-weekday-labels">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={i}>{label}</span>
          ))}
        </div>
        <div className="heatmap-grid">
          {columns.map((column, wi) => (
            <div className="heatmap-column" key={wi}>
              {column.map((day, di) =>
                day ? (
                  <div
                    key={day.date}
                    className="heatmap-cell"
                    style={{ background: LEVEL_COLORS[levelFor(day.durationMs)] }}
                    title={formatTooltip(day.date, day.durationMs)}
                  />
                ) : (
                  <div className="heatmap-cell heatmap-cell-empty" key={di} />
                ),
              )}
            </div>
          ))}
        </div>
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
