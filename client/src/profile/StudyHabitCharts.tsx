import type { ReactNode } from "react";
import { formatDurationLong } from "../room/timerMath";

interface HeatmapDay {
  date: string;
  durationMs: number;
}

interface StudyHabitChartsProps {
  heatmap: HeatmapDay[];
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="habit-chart">
      <div className="habit-chart-title">{title}</div>
      {children}
    </div>
  );
}

function BarChart({ bars }: { bars: Array<{ label: string; valueMs: number; tooltip: string }> }) {
  const maxMs = Math.max(1, ...bars.map((b) => b.valueMs));
  return (
    <div className="habit-chart-bars">
      {bars.map((bar, i) => (
        <div className="habit-bar-col" key={i} title={bar.tooltip}>
          <div className="habit-bar-track">
            <div
              className="habit-bar-fill"
              style={{ height: `${Math.max(2, Math.round((bar.valueMs / maxMs) * 100))}%` }}
            />
          </div>
          <span className="habit-bar-label">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

function TrendLine({ days }: { days: HeatmapDay[] }) {
  const width = 280;
  const height = 100;
  const maxMs = Math.max(1, ...days.map((d) => d.durationMs));
  const stepX = days.length > 1 ? width / (days.length - 1) : 0;
  const points = days.map((d, i) => {
    const x = i * stepX;
    const y = height - (d.durationMs / maxMs) * height;
    return { x, y };
  });
  const linePath = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPath = `0,${height} ${linePath} ${width},${height}`;

  return (
    <svg
      className="habit-trend-svg"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Study time trend over the last 30 days"
    >
      <polygon points={areaPath} fill="rgba(85, 152, 231, 0.25)" />
      <polyline points={linePath} fill="none" stroke="#5598e7" strokeWidth={2} />
    </svg>
  );
}

export function StudyHabitCharts({ heatmap }: StudyHabitChartsProps) {
  if (heatmap.length === 0) return null;

  const last7 = heatmap.slice(-7);
  const last7Bars = last7.map((day) => ({
    label: WEEKDAY_SHORT[weekdayOf(day.date)][0],
    valueMs: day.durationMs,
    tooltip: `${day.date}: ${formatDurationLong(day.durationMs)}`,
  }));

  const byWeekday = new Array(7).fill(0).map(() => ({ totalMs: 0, days: 0 }));
  for (const day of heatmap) {
    const bucket = byWeekday[weekdayOf(day.date)];
    bucket.totalMs += day.durationMs;
    bucket.days += 1;
  }
  const weekdayBars = byWeekday.map((bucket, i) => {
    const avgMs = bucket.days > 0 ? bucket.totalMs / bucket.days : 0;
    return {
      label: WEEKDAY_SHORT[i][0],
      valueMs: avgMs,
      tooltip: `${WEEKDAY_SHORT[i]} average: ${formatDurationLong(avgMs)}`,
    };
  });

  const last30 = heatmap.slice(-30);

  return (
    <div className="habit-charts">
      <ChartCard title="Last 7 days">
        <BarChart bars={last7Bars} />
      </ChartCard>
      <ChartCard title="By day of week">
        <BarChart bars={weekdayBars} />
      </ChartCard>
      <ChartCard title="Last 30 days trend">
        <TrendLine days={last30} />
      </ChartCard>
    </div>
  );
}
