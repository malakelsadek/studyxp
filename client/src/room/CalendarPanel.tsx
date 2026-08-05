import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { TimeBlock, TodoItem } from "../socket/types";

interface CalendarPanelProps {
  timeBlocks: TimeBlock[];
  personalTodos: TodoItem[];
  onAdd: (startMinute: number, endMinute: number, label: string, tasks: string[], date: string) => void;
  onRemove: (id: string) => void;
}

const PX_PER_MINUTE = 1;
const SNAP_MINUTES = 15;
const DEFAULT_BLOCK_MINUTES = 30;
const DAY_MINUTES = 24 * 60;
const MAX_DAY_OFFSET = 60;
const SCROLL_LEAD_MINUTES = 120;

function snap(minute: number): number {
  return Math.round(minute / SNAP_MINUTES) * SNAP_MINUTES;
}

function clampMinute(minute: number): number {
  return Math.min(DAY_MINUTES, Math.max(0, minute));
}

function formatClock(minute: number): string {
  const h24 = Math.floor(minute / 60) % 24;
  const m = minute % 60;
  const period = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDayLabel(offset: number, date: Date): string {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  if (offset === -1) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

interface Draft {
  startMinute: number;
  endMinute: number;
}

export function CalendarPanel({ timeBlocks, personalTodos, onAdd, onRemove }: CalendarPanelProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragOriginMinute = useRef<number | null>(null);
  const [dayOffset, setDayOffset] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [pending, setPending] = useState<Draft | null>(null);
  const [label, setLabel] = useState("");
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [nowMinute, setNowMinute] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const viewedDate = useMemo(() => addDays(new Date(), dayOffset), [dayOffset]);
  const viewedDateISO = useMemo(() => toISODate(viewedDate), [viewedDate]);
  const blocksForDay = useMemo(
    () => timeBlocks.filter((b) => b.date === viewedDateISO),
    [timeBlocks, viewedDateISO],
  );

  useEffect(() => {
    if (trackRef.current) {
      const leadMinute = Math.max(0, nowMinute - SCROLL_LEAD_MINUTES);
      trackRef.current.scrollTop = leadMinute * PX_PER_MINUTE;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNowMinute(d.getHours() * 60 + d.getMinutes());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const closePendingForm = () => {
    setDraft(null);
    setPending(null);
    setLabel("");
    setSelectedTasks([]);
  };

  const goToDay = (nextOffset: number) => {
    closePendingForm();
    setDayOffset(Math.max(-MAX_DAY_OFFSET, Math.min(MAX_DAY_OFFSET, nextOffset)));
  };

  const minuteFromClientY = (clientY: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    const offsetY = clientY - rect.top + track.scrollTop;
    return clampMinute(snap(offsetY / PX_PER_MINUTE));
  };

  const handleTrackMouseDown = (e: ReactMouseEvent) => {
    if ((e.target as HTMLElement).closest(".timeblock-bar")) return;
    const startMinute = minuteFromClientY(e.clientY);
    dragOriginMinute.current = startMinute;
    setDraft({ startMinute, endMinute: startMinute });

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (dragOriginMinute.current === null) return;
      const current = minuteFromClientY(moveEvent.clientY);
      const origin = dragOriginMinute.current;
      setDraft({ startMinute: Math.min(origin, current), endMinute: Math.max(origin, current) });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      const origin = dragOriginMinute.current;
      dragOriginMinute.current = null;
      if (origin === null) return;

      setDraft((current) => {
        if (!current) return null;
        const spanMinutes = current.endMinute - current.startMinute;
        const finalBlock =
          spanMinutes >= SNAP_MINUTES
            ? current
            : {
                startMinute: current.startMinute,
                endMinute: clampMinute(current.startMinute + DEFAULT_BLOCK_MINUTES),
              };
        setPending(finalBlock);
        return null;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const toggleTask = (text: string) => {
    setSelectedTasks((prev) => (prev.includes(text) ? prev.filter((t) => t !== text) : [...prev, text]));
  };

  const confirmPending = () => {
    if (!pending) return;
    onAdd(pending.startMinute, pending.endMinute, label.trim(), selectedTasks, viewedDateISO);
    setPending(null);
    setLabel("");
    setSelectedTasks([]);
  };

  const cancelPending = () => {
    setPending(null);
    setLabel("");
    setSelectedTasks([]);
  };

  const visibleBlock = draft ?? pending;

  return (
    <div className="calendar-panel">
      <div className="calendar-day-nav">
        <button
          onClick={() => goToDay(dayOffset - 1)}
          disabled={dayOffset <= -MAX_DAY_OFFSET}
          aria-label="Previous day"
        >
          ‹
        </button>
        <span className="calendar-day-label">{formatDayLabel(dayOffset, viewedDate)}</span>
        <button onClick={() => goToDay(dayOffset + 1)} disabled={dayOffset >= MAX_DAY_OFFSET} aria-label="Next day">
          ›
        </button>
      </div>

      <div ref={trackRef} className="calendar-track" onMouseDown={handleTrackMouseDown}>
        <div className="calendar-track-inner" style={{ height: DAY_MINUTES * PX_PER_MINUTE }}>
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="calendar-hour-line" style={{ top: hour * 60 * PX_PER_MINUTE }}>
              <span className="calendar-hour-label">{formatClock(hour * 60)}</span>
            </div>
          ))}

          {blocksForDay.map((block) => (
            <div
              key={block.id}
              className="timeblock-bar"
              style={{
                top: block.startMinute * PX_PER_MINUTE,
                height: Math.max(16, (block.endMinute - block.startMinute) * PX_PER_MINUTE),
              }}
            >
              <div className="timeblock-bar-header">
                <span className="timeblock-bar-time">
                  {formatClock(block.startMinute)} – {formatClock(block.endMinute)}
                </span>
                <button
                  onClick={() => onRemove(block.id)}
                  aria-label="Remove block"
                  className="timeblock-bar-remove"
                >
                  ×
                </button>
              </div>
              {block.label && <div className="timeblock-bar-label">{block.label}</div>}
              {block.tasks.length > 0 && (
                <div className="timeblock-bar-tasks">{block.tasks.join(", ")}</div>
              )}
            </div>
          ))}

          {dayOffset === 0 && <div className="calendar-now-line" style={{ top: nowMinute * PX_PER_MINUTE }} />}

          {visibleBlock && (
            <div
              className="timeblock-ghost"
              style={{
                top: visibleBlock.startMinute * PX_PER_MINUTE,
                height: Math.max(4, (visibleBlock.endMinute - visibleBlock.startMinute) * PX_PER_MINUTE),
              }}
            >
              {formatClock(visibleBlock.startMinute)} – {formatClock(visibleBlock.endMinute)}
            </div>
          )}
        </div>
      </div>

      {!pending && <p className="calendar-hint">Click and drag on the timeline to block out time.</p>}

      {pending && (
        <div className="timeblock-form">
          <div className="timeblock-form-range">
            {formatClock(pending.startMinute)} – {formatClock(pending.endMinute)}
          </div>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="What's this block for?"
            maxLength={100}
            autoFocus
          />
          {personalTodos.length > 0 ? (
            <div className="timeblock-task-picker">
              {personalTodos.map((task) => (
                <label key={task.id} className="timeblock-task-option">
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task.text)}
                    onChange={() => toggleTask(task.text)}
                  />
                  <span>{task.text}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="calendar-hint">Add personal tasks in the To-do tile to link them to this block.</p>
          )}
          <div className="timeblock-form-actions">
            <button onClick={confirmPending}>Add block</button>
            <button type="button" onClick={cancelPending}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
