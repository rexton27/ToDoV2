import { useState, useEffect } from "react";

const CACHE_KEY = "todov2_weather_cache";
const CACHE_TTL = 30 * 60 * 1000;

const WMO_MAP: Record<number, { condition: string; icon: string }> = {
  0:  { condition: "Clear",        icon: "☀️" },
  1:  { condition: "Mainly clear", icon: "🌤" },
  2:  { condition: "Partly cloudy",icon: "⛅" },
  3:  { condition: "Overcast",     icon: "☁️" },
  45: { condition: "Fog",          icon: "🌫" },
  48: { condition: "Fog",          icon: "🌫" },
  51: { condition: "Drizzle",      icon: "🌧" },
  53: { condition: "Drizzle",      icon: "🌧" },
  55: { condition: "Drizzle",      icon: "🌧" },
  61: { condition: "Rain",         icon: "🌧" },
  63: { condition: "Rain",         icon: "🌧" },
  65: { condition: "Rain",         icon: "🌧" },
  66: { condition: "Rain",         icon: "🌧" },
  67: { condition: "Rain",         icon: "🌧" },
  71: { condition: "Snow",         icon: "🌨" },
  73: { condition: "Snow",         icon: "🌨" },
  75: { condition: "Snow",         icon: "🌨" },
  77: { condition: "Snow",         icon: "🌨" },
  80: { condition: "Showers",      icon: "🌦" },
  81: { condition: "Showers",      icon: "🌦" },
  82: { condition: "Showers",      icon: "🌦" },
  85: { condition: "Snow showers", icon: "🌨" },
  86: { condition: "Snow showers", icon: "🌨" },
  95: { condition: "Thunderstorm", icon: "⛈" },
  96: { condition: "Thunderstorm", icon: "⛈" },
  99: { condition: "Thunderstorm", icon: "⛈" },
};

function decodeWMO(code: number): { condition: string; icon: string } {
  return WMO_MAP[code] ?? { condition: "Unknown", icon: "🌡" };
}

export interface WeatherData {
  temp: number;
  condition: string;
  icon: string;
}

interface CacheEntry extends WeatherData {
  fetchedAt: number;
}

function readCache(): WeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.fetchedAt > CACHE_TTL) return null;
    return { temp: entry.temp, condition: entry.condition, icon: entry.icon };
  } catch {
    return null;
  }
}

function writeCache(data: WeatherData): void {
  try {
    const entry: CacheEntry = { ...data, fetchedAt: Date.now() };
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage unavailable — ignore
  }
}

async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=celsius`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Weather fetch failed");
  const json = await res.json();
  const temp = Math.round(json.current.temperature_2m as number);
  const { condition, icon } = decodeWMO(json.current.weather_code as number);
  return { temp, condition, icon };
}

export function useWeather(): WeatherData | null {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached) {
      setWeather(cached);
      return;
    }

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const data = await fetchWeather(
            pos.coords.latitude,
            pos.coords.longitude
          );
          writeCache(data);
          setWeather(data);
        } catch {
          // Fail silently — chip won't appear
        }
      },
      () => {
        // Permission denied — chip won't appear
      }
    );
  }, []);

  return weather;
}
