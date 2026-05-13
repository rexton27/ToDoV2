# API Integrations — Design Spec

**Date:** 2026-05-11
**Status:** Approved
**Branch:** design

---

## What we're building

Two ambient data sources that add context to the task screen without touching task logic or prioritisation:

1. **Weather** — current conditions at the user's location, displayed as a chip in the header
2. **Daily affirmation** — a short handwritten phrase that changes daily, displayed between the heading and subheading on the For you tab

---

## Weather

### Data source

**Open-Meteo** (`https://api.open-meteo.com/v1/forecast`)
- Free, no API key required
- Returns `temperature_2m` (°C) and `weather_code` (WMO code) for current conditions
- Full URL: `https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m,weather_code&temperature_unit=celsius`

### Location

Browser `navigator.geolocation.getCurrentPosition()`. The browser shows its own permission prompt on first use. If the user denies permission, or if geolocation is unavailable, the WeatherChip does not render — no error message, no empty space.

### Caching

Weather is fetched once and stored in `localStorage` with a timestamp. On subsequent renders, the cache is used if less than 30 minutes old. This prevents re-fetching on every page navigation.

```
localStorage key: "todov2_weather_cache"
value: { temp, condition, icon, fetchedAt: timestamp }
```

### WMO weather code → display

| Code range | Condition | Icon |
|---|---|---|
| 0 | Clear sky | ☀️ |
| 1–3 | Partly cloudy | 🌤 |
| 45–48 | Fog | 🌫 |
| 51–67 | Drizzle / rain | 🌧 |
| 71–77 | Snow | 🌨 |
| 80–82 | Rain showers | 🌦 |
| 85–86 | Snow showers | 🌨 |
| 95–99 | Thunderstorm | ⛈ |

### Display

A small chip in the TaskView header, sitting between the time chip and the "Change" button:

```
[🌿 Calm]  [30 min]          [🌤 18° Partly cloudy]  Change
```

Styled to match the existing time chip: `stone-100` background, `stone-500` text, `rounded-full`, `text-xs font-medium`.

### Error handling

If geolocation is denied, times out, or the Open-Meteo fetch fails: `WeatherChip` returns `null`. The header layout is unaffected — the chip slot is simply empty.

---

## Daily affirmation

### Data source

A local curated array in `lib/affirmations.ts` — no external API, no network request, no loading state, no failure mode.

`getDailyAffirmation()` picks by day of year:
```ts
const dayOfYear = Math.floor(
  (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
);
return AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];
```

This means the affirmation changes at midnight and is the same for all users on a given day.

### Starter set (20 affirmations)

```
"One thing at a time."
"You don't have to do it all today."
"Small steps count."
"Rest is part of the work."
"Progress, not perfection."
"You're allowed to go slowly."
"What you do today is enough."
"Steady wins."
"It's okay to start small."
"One task, then breathe."
"Finishing something counts."
"You're already doing it."
"Gentle is fine."
"Less is more today."
"Just begin."
"Every small step moves you forward."
"Today doesn't have to be perfect."
"You've done hard things before."
"One moment at a time."
"Show up, that's enough."
```

### Display

On the For you tab, between the heading and the existing subheading:

```
Here's what today can hold          ← h1, font-semibold, stone-700
One thing at a time.                ← affirmation, italic, stone-400, text-sm
We're not doing everything. Just this.  ← existing subheading, stone-400, text-sm
```

The affirmation is styled as `text-sm italic text-stone-400 dark:text-zinc-500 mt-0.5`.

It only appears on the For you tab — the All Tasks tab is a management surface and doesn't need it.

---

## Architecture

### Files to create

**`todov2/lib/weather.ts`**
- `useWeather()` React hook
- Handles: geolocation request → cache check → Open-Meteo fetch → return state
- Returns: `{ temp: number, condition: string, icon: string, isLoading: boolean } | null`
- On any error: returns `null`

**`todov2/lib/affirmations.ts`**
- `AFFIRMATIONS: string[]` — curated array
- `getDailyAffirmation(): string` — picks by day of year

**`todov2/app/components/WeatherChip.tsx`**
- Calls `useWeather()`
- Renders chip when data is available, `null` when loading or unavailable
- No spinner — absence is the graceful degraded state

### Files to modify

**`todov2/app/components/TaskView.tsx`**
- Import and render `<WeatherChip />` in the header between time chip and "Change" button
- Import `getDailyAffirmation` and render affirmation line in the For you tab heading block

---

## What we ruled out

| Decision | What we ruled out | Why |
|---|---|---|
| Affirmation source | External quotes API | No key, no latency, full tone control |
| Weather display | Full weather card / widget | Too heavy — ambient means quiet |
| Location input | Manual city entry | Adds friction; geolocation is instant |
| Affirmation placement | All Tasks tab | Management surface — no copy needed there |
| Error display | "Location unavailable" message | Absence is cleaner than an error state |
