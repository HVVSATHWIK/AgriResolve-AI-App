import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchCurrentWeather, fetchLocationName, type CurrentWeather, type LocationName } from '../../../services/weather';

export type LocationConsent = 'unknown' | 'granted' | 'denied';

type StoredCoords = { latitude: number; longitude: number; accuracy?: number; timestamp: number };

type StoredWeather = {
  weather: CurrentWeather;
  locationName?: LocationName;
  coords: { latitude: number; longitude: number };
  fetchedAt: number
};

// Bump keys to avoid getting stuck in a previous persisted "denied" state from older builds.
const LS_CONSENT = 'agriresolve_location_consent_v3';
const LS_COORDS = 'agriresolve_location_coords_v3';
const LS_WEATHER = 'agriresolve_weather_cache_v3';

const safeParse = <T,>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

export const useLocationWeather = () => {
  const hasGeolocation = useMemo(() => typeof navigator !== 'undefined' && 'geolocation' in navigator, []);

  const [consent, setConsent] = useState<LocationConsent>(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LS_CONSENT) : null;
    if (stored === 'granted' || stored === 'denied' || stored === 'unknown') return stored;
    return 'unknown';
  });

  const [coords, setCoords] = useState<StoredCoords | null>(() => {
    const stored = typeof window !== 'undefined' ? safeParse<StoredCoords>(window.localStorage.getItem(LS_COORDS)) : null;
    return stored;
  });

  const [weather, setWeather] = useState<CurrentWeather | null>(() => {
    const stored = typeof window !== 'undefined' ? safeParse<StoredWeather>(window.localStorage.getItem(LS_WEATHER)) : null;
    return stored?.weather ?? null;
  });

  const [locationName, setLocationName] = useState<LocationName | undefined>(() => {
    const stored = typeof window !== 'undefined' ? safeParse<StoredWeather>(window.localStorage.getItem(LS_WEATHER)) : null;
    return stored?.locationName;
  });

  const [weatherUpdatedAt, setWeatherUpdatedAt] = useState<number | null>(() => {
    const stored = typeof window !== 'undefined' ? safeParse<StoredWeather>(window.localStorage.getItem(LS_WEATHER)) : null;
    return stored?.fetchedAt ?? null;
  });

  const persistConsent = useCallback((next: LocationConsent) => {
    setConsent(next);
    try {
      window.localStorage.setItem(LS_CONSENT, next);
    } catch {
      // ignore
    }
  }, []);

  const persistCoords = useCallback((next: StoredCoords) => {
    setCoords(next);
    try {
      window.localStorage.setItem(LS_COORDS, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const persistWeather = useCallback((next: StoredWeather) => {
    setWeather(next.weather);
    setLocationName(next.locationName);
    setWeatherUpdatedAt(next.fetchedAt);
    try {
      window.localStorage.setItem(LS_WEATHER, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!hasGeolocation) {
      persistConsent('denied');
      return { ok: false as const, reason: 'unsupported' as const };
    }

    return new Promise<{ ok: true } | { ok: false; reason: 'denied' | 'unavailable' | 'unsupported' }>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const nextCoords: StoredCoords = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: Date.now(),
          };
          persistCoords(nextCoords);
          persistConsent('granted');
          resolve({ ok: true });
        },
        (err) => {
          if (err?.code === 1) {
            persistConsent('denied');
            resolve({ ok: false, reason: 'denied' });
          } else {
            // Position unavailable / timeout: do NOT persist a denial.
            // Keep consent as "unknown" so we can ask again later.
            persistConsent('unknown');
            resolve({ ok: false, reason: 'unavailable' });
          }
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 15 * 60 * 1000 }
      );
    });
  }, [hasGeolocation, persistConsent, persistCoords]);

  const disable = useCallback(() => {
    persistConsent('denied');
  }, [persistConsent]);

  const refreshWeather = useCallback(async () => {
    if (consent !== 'granted' || !coords) return null;

    let cached: StoredWeather | null = null;
    try {
      cached = safeParse<StoredWeather>(window.localStorage.getItem(LS_WEATHER));
    } catch {
      cached = null;
    }
    const now = Date.now();
    const CACHE_MS = 10 * 60 * 1000; // 10 minutes

    if (cached?.fetchedAt && now - cached.fetchedAt < CACHE_MS) {
      setWeather(cached.weather);
      setLocationName(cached.locationName);
      setWeatherUpdatedAt(cached.fetchedAt);
      return cached.weather;
    }

    // Parallel fetch for speed
    const [latestWeather, latestLocation] = await Promise.all([
      fetchCurrentWeather(coords.latitude, coords.longitude),
      fetchLocationName(coords.latitude, coords.longitude)
    ]);

    if (!latestWeather) return null;

    persistWeather({
      weather: latestWeather,
      locationName: latestLocation || undefined,
      coords: { latitude: coords.latitude, longitude: coords.longitude },
      fetchedAt: now,
    });

    return latestWeather;
  }, [consent, coords, persistWeather]);

  // On first load: if already granted, ensure we have weather.
  useEffect(() => {
    if (consent !== 'granted') return;
    if (!coords) return;
    refreshWeather();
  }, [consent, coords, refreshWeather]);

  const locationContextForPrompt = useMemo(() => {
    if (consent !== 'granted' || !coords) return null;

    const parts: string[] = [];

    // Add explicitly named location if available
    if (locationName?.displayName) {
      parts.push(`Detailed Location: ${locationName.displayName}.`);
    } else {
      parts.push(`Approximate coordinates: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}.`);
    }

    if (weather) {
      const temp = typeof weather.temperatureC === 'number' ? `${weather.temperatureC.toFixed(1)}°C` : null;
      const humidity = typeof weather.humidityPercent === 'number' ? `${weather.humidityPercent}% RH` : null;
      const precipitation = typeof weather.precipitationMm === 'number' ? `${weather.precipitationMm} mm precip` : null;
      const wind = typeof weather.windSpeedKph === 'number' ? `${weather.windSpeedKph} km/h wind` : null;
      const observedAt = weather.observedAt ? `Observed at: ${weather.observedAt} (${weather.timezone || 'local time'}).` : null;

      parts.push(
        `Current weather: ${[
          temp,
          humidity,
          precipitation,
          wind,
          typeof weather.weatherCode === 'number' ? `code ${weather.weatherCode}` : null,
        ]
          .filter(Boolean)
          .join(', ')}.`
      );

      if (observedAt) parts.push(observedAt);
    } else {
      parts.push('Current weather: (not yet fetched).');
    }

    if (weatherUpdatedAt) {
      parts.push(`Weather cache updated: ${new Date(weatherUpdatedAt).toISOString()}.`);
    }

    return parts.join(' ');
  }, [consent, coords, weather, locationName, weatherUpdatedAt]);

  return {
    consent,
    hasGeolocation,
    coords,
    weather,
    locationName,
    weatherUpdatedAt,
    requestPermission,
    disable,
    refreshWeather,
    locationContextForPrompt,
  };
};
