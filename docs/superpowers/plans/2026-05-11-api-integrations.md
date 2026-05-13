# API Integrations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two ambient data sources to the task screen — a weather chip in the header (Open-Meteo, no API key) and a daily affirmation line on the For you tab (local curated list).

**Architecture:** `lib/affirmations.ts` exports a curated array + day-of-year picker. `lib/weather.ts` exports a `useWeather()` hook that handles geolocation, Open-Meteo fetch, and 30-minute localStorage cache. `WeatherChip` renders the hook result or nothing on failure. `TaskView` wires both in — chip into the header, affirmation into the For you heading block.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript. No new dependencies — uses native `fetch` and `navigator.geolocation`.

> **Note:** No test suite. Skip TDD steps — implement directly and verify in the browser with `npm run dev` from `todov2/`.

---

## Files

| File | Action |
|---|---|
| `todov2/lib/affirmations.ts` | Create — curated array + `getDailyAffirmation()` |
| `todov2/lib/weather.ts` | Create — `useWeather()` hook with geolocation, fetch, cache |
| `todov2/app/components/WeatherChip.tsx` | Create — renders chip or null |
| `todov2/app/components/TaskView.tsx` | Modify — add chip to header, affirmation to heading |

---

### Task 1: Create `lib/affirmations.ts`

**File:** Create `todov2/lib/affirmations.ts`

- [ ] **Step 1: Create the file**

```ts
export const AFFIRMATIONS = [
  "One thing at a time.",
  "You don't have to do it all today.",
  "Small steps count.",
  "Rest is part of the work.",
  "Progress, not perfection.",
  "You're allowed to go slowly.",
  "What you do today is enough.",
  "Steady wins.",
  "It's okay to start small.",
  "One task, then breathe.",
  "Finishing something counts.",
  "You're already doing it.",
  "Gentle is fine.",
  "Less is more today.",
  "Just begin.",
  "Every small step moves you forward.",
  "Today doesn't have to be perfect.",
  "You've done hard things before.",
  "One moment at a time.",
  "Show up, that's enough.",
] as const;

export function getDailyAffirmation(): string {
  const startOfYear = new Date(new Date().getFullYear(), 0, 0).getTime();
  const dayOfYear = Math.floor((Date.now() - startOfYear) / 86400000);
  return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
}
```

- [ ] **Step 2: Verify type check passes**

```bash
cd todov2 && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add todov2/lib/affirmations.ts
git commit -m "feat: add daily affirmation list and day-of-year picker"
```

---

### Task 2: Create `lib/weather.ts`

**File:** Create `todov2/lib/weather.ts`

- [ ] **Step 1: Create the file**

```ts
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
```

- [ ] **Step 2: Verify type check passes**

```bash
cd todov2 && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add todov2/lib/weather.ts
git commit -m "feat: add useWeather hook with geolocation, Open-Meteo fetch, and localStorage cache"
```

---

### Task 3: Create `app/components/WeatherChip.tsx`

**File:** Create `todov2/app/components/WeatherChip.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Verify type check passes**

```bash
cd todov2 && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add todov2/app/components/WeatherChip.tsx
git commit -m "feat: add WeatherChip component"
```

---

### Task 4: Wire into `TaskView`

**File:** Modify `todov2/app/components/TaskView.tsx`

- [ ] **Step 1: Add imports**

At the top of `todov2/app/components/TaskView.tsx`, add two imports after the existing import block:

```tsx
import WeatherChip from "./WeatherChip";
import { getDailyAffirmation } from "@/lib/affirmations";
```

- [ ] **Step 2: Add WeatherChip to the header and affirmation to the heading**

Replace the entire `return (...)` in `TaskView` with:

```tsx
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
              {emoji} {label}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
              {time === 60 ? "60+ min" : `${time} min`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <WeatherChip />
            <button
              onClick={onChangeContext}
              className="text-xs text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div role="tablist" aria-label="Task views" className="max-w-lg mx-auto px-6 flex">
          {(["foryou", "all"] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`py-2.5 px-1 mr-5 text-sm font-medium border-b-2 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded-sm ${
                tab === t
                  ? "border-violet-500 text-violet-500 dark:text-violet-400 dark:border-violet-400"
                  : "border-transparent text-stone-400 dark:text-zinc-500 hover:text-stone-600 dark:hover:text-zinc-300"
              }`}
            >
              {t === "foryou" ? "For you" : "All tasks"}
            </button>
          ))}
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-6 flex flex-col gap-5">
        {tab === "all" ? (
          <AllTasksView
            userId={userId}
            onViewCompleted={onViewCompleted}
            onAddTask={() => setShowAdd(true)}
          />
        ) : (
          <>
            <div>
              <h1 className="text-xl font-semibold text-stone-700 dark:text-zinc-100">
                Here's what today can hold
              </h1>
              <p className="text-sm italic text-stone-400 dark:text-zinc-500 mt-0.5">
                {getDailyAffirmation()}
              </p>
              <p className="text-sm text-stone-400 dark:text-zinc-500 mt-1">
                We're not doing everything. Just this.
              </p>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <p className="text-sm text-stone-400 dark:text-zinc-500">{emptyMessage}</p>
                <button
                  onClick={() => setShowAdd(true)}
                  className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors duration-200"
                >
                  + Add task
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {tasks.map((todo) => (
                  <TaskCard key={todo.id} todo={todo} />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* Bottom bar — For you tab only */}
      {tab === "foryou" && !isLoading && tasks.length > 0 && (
        <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
          <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setShowAdd(true)}
              className="text-sm font-medium text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors duration-200"
            >
              + Add task
            </button>
            <button
              onClick={onViewCompleted}
              className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors duration-200"
            >
              View completed
            </button>
          </div>
        </footer>
      )}

      {showAdd && <AddTaskSheet userId={userId} onClose={() => setShowAdd(false)} />}
    </div>
  );
```

- [ ] **Step 3: Verify type check passes**

```bash
cd todov2 && npx tsc --noEmit
```
Expected: no output.

- [ ] **Step 4: Start the dev server and verify in the browser**

```bash
cd todov2 && npm run dev
```

Open http://localhost:3000, sign in, pick a mood + time. Verify:
- Browser prompts for location permission
- If granted: weather chip appears in the header to the left of "Change" — e.g. `⛅ 18° Partly cloudy`
- If denied: no chip, no error, header looks normal
- On the For you tab: affirmation appears in italic below the heading, above "We're not doing everything. Just this."
- On the All tasks tab: no affirmation (correct — it's For you only)
- Hard-refresh: weather loads from localStorage cache (no second geolocation prompt)
- Check tomorrow (or temporarily set system date forward): affirmation changes

- [ ] **Step 5: Commit**

```bash
git add todov2/app/components/TaskView.tsx
git commit -m "feat: wire WeatherChip into header and daily affirmation into For you tab"
```
