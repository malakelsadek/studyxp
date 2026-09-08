import { CalculationMethod, Coordinates, Madhab, PrayerTimes as AdhanPrayerTimes } from "adhan";

export type PrayerCalculationMethod =
  | "MuslimWorldLeague"
  | "Egyptian"
  | "Karachi"
  | "UmmAlQura"
  | "Dubai"
  | "MoonsightingCommittee"
  | "NorthAmerica"
  | "Kuwait"
  | "Qatar"
  | "Singapore"
  | "Tehran"
  | "Turkey";

export const PRAYER_CALCULATION_METHODS: Array<{ value: PrayerCalculationMethod; label: string }> = [
  { value: "MuslimWorldLeague", label: "Muslim World League" },
  { value: "Egyptian", label: "Egyptian" },
  { value: "Karachi", label: "Karachi" },
  { value: "UmmAlQura", label: "Umm al-Qura" },
  { value: "Dubai", label: "Dubai" },
  { value: "MoonsightingCommittee", label: "Moonsighting Committee" },
  { value: "NorthAmerica", label: "North America (ISNA)" },
  { value: "Kuwait", label: "Kuwait" },
  { value: "Qatar", label: "Qatar" },
  { value: "Singapore", label: "Singapore" },
  { value: "Tehran", label: "Tehran" },
  { value: "Turkey", label: "Turkey" },
];

export type PrayerMadhab = "Shafi" | "Hanafi";

export interface PrayerCoordinates {
  latitude: number;
  longitude: number;
}

export type PrayerName = "Fajr" | "Dhuhr" | "Asr" | "Maghrib" | "Isha";

export const PRAYER_NAMES: PrayerName[] = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"];

export interface PrayerTime {
  name: PrayerName;
  time: Date;
}

function methodFactory(method: PrayerCalculationMethod) {
  return CalculationMethod[method]();
}

export function computePrayerTimes(
  coords: PrayerCoordinates,
  date: Date,
  method: PrayerCalculationMethod,
  madhab: PrayerMadhab,
): PrayerTime[] {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = methodFactory(method);
  params.madhab = madhab === "Hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  const times = new AdhanPrayerTimes(coordinates, date, params);
  return [
    { name: "Fajr", time: times.fajr },
    { name: "Dhuhr", time: times.dhuhr },
    { name: "Asr", time: times.asr },
    { name: "Maghrib", time: times.maghrib },
    { name: "Isha", time: times.isha },
  ];
}
