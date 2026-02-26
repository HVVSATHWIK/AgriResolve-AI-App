export type CurrentWeather = {
  temperatureC?: number;
  humidityPercent?: number;
  precipitationMm?: number;
  windSpeedKph?: number;
  weatherCode?: number;
  observedAt?: string;
  timezone?: string;
};

export async function fetchCurrentWeather(latitude: number, longitude: number): Promise<CurrentWeather | null> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', [
    'temperature_2m',
    'relative_humidity_2m',
    'precipitation',
    'weather_code',
    'wind_speed_10m'
  ].join(','));
  url.searchParams.set('timezone', 'auto');

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'accept': 'application/json' },
  });

  if (!response.ok) return null;

  const json = await response.json();
  const current = json?.current;
  if (!current) return null;

  return {
    temperatureC: typeof current.temperature_2m === 'number' ? current.temperature_2m : undefined,
    humidityPercent: typeof current.relative_humidity_2m === 'number' ? current.relative_humidity_2m : undefined,
    precipitationMm: typeof current.precipitation === 'number' ? current.precipitation : undefined,
    windSpeedKph: typeof current.wind_speed_10m === 'number' ? current.wind_speed_10m : undefined,
    weatherCode: typeof current.weather_code === 'number' ? current.weather_code : undefined,
    observedAt: typeof current.time === 'string' ? current.time : undefined,
    timezone: typeof json.timezone === 'string' ? json.timezone : undefined,
  };
}

export type LocationName = {
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  country?: string;
  displayName: string;
};

export async function fetchLocationName(latitude: number, longitude: number): Promise<LocationName | null> {
  try {
    console.log('[Geo] Fetching name for:', latitude, longitude);
    const url = new URL('https://nominatim.openstreetmap.org/reverse');
    url.searchParams.set('format', 'json');
    url.searchParams.set('lat', String(latitude));
    url.searchParams.set('lon', String(longitude));
    url.searchParams.set('zoom', '10'); // City/Town level
    url.searchParams.set('addressdetails', '1');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'AgriResolve-AI/1.0',
        'Accept-Language': 'en'
      },
    });

    if (!response.ok) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await response.json();
    const addr = data.address || {};

    // Prioritize specific to general
    const city = addr.city || addr.town || addr.village || addr.suburb || addr.county;
    const state = addr.state || addr.region;
    const country = addr.country;

    const parts = [city, state, country].filter(Boolean);
    const displayName = parts.length > 0 ? parts.join(', ') : 'Unknown Location';

    return {
      city: addr.city,
      town: addr.town,
      village: addr.village,
      state: addr.state,
      country: addr.country,
      displayName
    };
  } catch (err) {
    console.warn("Failed to reverse geocode:", err);
    return null;
  }
}
