"use client";

import { useWeather } from "@/lib/weather";

export default function WeatherChip() {
  const weather = useWeather();
  if (!weather) return null;

  return (
    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 whitespace-nowrap">
      {weather.icon} {weather.temp}° {weather.condition}
    </span>
  );
}
