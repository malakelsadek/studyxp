import { useCallback, useState } from "react";
import type { PrayerCalculationMethod, PrayerCoordinates, PrayerMadhab } from "./prayerTimes";

const ENABLED_KEY = "studyxp.prayerTimes.enabled";
const METHOD_KEY = "studyxp.prayerTimes.method";
const MADHAB_KEY = "studyxp.prayerTimes.madhab";
const COORDS_KEY = "studyxp.prayerTimes.coords";

function loadEnabled(): boolean {
  try {
    return localStorage.getItem(ENABLED_KEY) === "true";
  } catch {
    return false;
  }
}

function loadMethod(): PrayerCalculationMethod {
  try {
    const value = localStorage.getItem(METHOD_KEY);
    return (value as PrayerCalculationMethod) || "MuslimWorldLeague";
  } catch {
    return "MuslimWorldLeague";
  }
}

function loadMadhab(): PrayerMadhab {
  try {
    return localStorage.getItem(MADHAB_KEY) === "Hanafi" ? "Hanafi" : "Shafi";
  } catch {
    return "Shafi";
  }
}

function loadCoords(): PrayerCoordinates | null {
  try {
    const raw = localStorage.getItem(COORDS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.latitude === "number" && typeof parsed?.longitude === "number") {
      return { latitude: parsed.latitude, longitude: parsed.longitude };
    }
    return null;
  } catch {
    return null;
  }
}

// A personal, opt-in, device-local preference — like chat size and name color, this never
// touches the server. Location in particular is sensitive, so it's kept in localStorage only.
export function usePrayerTimesPreference() {
  const [enabled, setEnabledState] = useState(loadEnabled);
  const [method, setMethodState] = useState<PrayerCalculationMethod>(loadMethod);
  const [madhab, setMadhabState] = useState<PrayerMadhab>(loadMadhab);
  const [coordinates, setCoordinatesState] = useState<PrayerCoordinates | null>(loadCoords);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const requestLocation = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Location isn't available in this browser.");
      return;
    }
    setLocating(true);
    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: PrayerCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinatesState(coords);
        try {
          localStorage.setItem(COORDS_KEY, JSON.stringify(coords));
        } catch {
          // best-effort persistence
        }
        setLocating(false);
      },
      () => {
        setLocationError("Couldn't get your location — check your browser's location permission.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  const setEnabled = useCallback(
    (value: boolean) => {
      setEnabledState(value);
      try {
        localStorage.setItem(ENABLED_KEY, String(value));
      } catch {
        // best-effort persistence
      }
      if (value && !loadCoords()) requestLocation();
    },
    [requestLocation],
  );

  const setMethod = useCallback((value: PrayerCalculationMethod) => {
    setMethodState(value);
    try {
      localStorage.setItem(METHOD_KEY, value);
    } catch {
      // best-effort persistence
    }
  }, []);

  const setMadhab = useCallback((value: PrayerMadhab) => {
    setMadhabState(value);
    try {
      localStorage.setItem(MADHAB_KEY, value);
    } catch {
      // best-effort persistence
    }
  }, []);

  return {
    enabled,
    setEnabled,
    method,
    setMethod,
    madhab,
    setMadhab,
    coordinates,
    requestLocation,
    locating,
    locationError,
  };
}
