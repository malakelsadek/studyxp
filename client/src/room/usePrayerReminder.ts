import { useEffect, useMemo, useState } from "react";
import {
  computePrayerTimes,
  type PrayerCalculationMethod,
  type PrayerCoordinates,
  type PrayerMadhab,
  type PrayerName,
} from "./prayerTimes";

const CHECK_INTERVAL_MS = 20000;

type PrayerStatus = "prayed" | "skipped";

function dayKeyFor(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function logStorageKey(date: Date): string {
  return `studyxp.prayerLog.${dayKeyFor(date)}`;
}

function loadPrayerLog(date: Date): Partial<Record<PrayerName, PrayerStatus>> {
  try {
    const raw = localStorage.getItem(logStorageKey(date));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export interface PrayerChecklistItem {
  name: PrayerName;
  time: Date;
  due: boolean;
  prayed: boolean;
  skipped: boolean;
}

export function usePrayerReminder(
  enabled: boolean,
  coordinates: PrayerCoordinates | null,
  method: PrayerCalculationMethod,
  madhab: PrayerMadhab,
) {
  const [now, setNow] = useState(() => new Date());
  const [dayKey, setDayKey] = useState(() => dayKeyFor(new Date()));
  const [prayerLog, setPrayerLog] = useState<Partial<Record<PrayerName, PrayerStatus>>>(() =>
    loadPrayerLog(new Date()),
  );

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => setNow(new Date()), CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    const currentDayKey = dayKeyFor(now);
    if (currentDayKey !== dayKey) {
      setDayKey(currentDayKey);
      setPrayerLog(loadPrayerLog(now));
    }
  }, [now, dayKey]);

  const times = useMemo(() => {
    if (!enabled || !coordinates) return [];
    return computePrayerTimes(coordinates, now, method, madhab);
    // Recompute once per day (dayKey) plus whenever settings change; `now` ticking every
    // 20s would otherwise recompute solar angles for no reason.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, coordinates, method, madhab, dayKey]);

  const checklist: PrayerChecklistItem[] = times.map((t) => ({
    name: t.name,
    time: t.time,
    due: t.time.getTime() <= now.getTime(),
    prayed: prayerLog[t.name] === "prayed",
    skipped: prayerLog[t.name] === "skipped",
  }));

  const duePrayer = checklist.find((item) => item.due && !item.prayed && !item.skipped) ?? null;
  const nextPrayer = checklist.find((item) => !item.due) ?? null;

  const setStatus = (name: PrayerName, status: PrayerStatus | null) => {
    setPrayerLog((prev) => {
      const next = { ...prev };
      if (status) next[name] = status;
      else delete next[name];
      try {
        localStorage.setItem(logStorageKey(now), JSON.stringify(next));
      } catch {
        // best-effort persistence
      }
      return next;
    });
  };

  const markPrayed = (name: PrayerName) => setStatus(name, "prayed");
  const skipPrayer = (name: PrayerName) => setStatus(name, "skipped");
  const unmarkPrayed = (name: PrayerName) => setStatus(name, null);

  return { checklist, duePrayer, nextPrayer, markPrayed, skipPrayer, unmarkPrayed };
}
