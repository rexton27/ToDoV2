# Implementation Plan: Feelings × Time To-Do App

## Context

The goal is to transform the blank Next.js + InstantDB starter into the Feelings × Time To-Do app described in the PRD. The core idea: instead of showing all tasks, the app asks the user how they feel and how much time they have, then surfaces 1–5 curated tasks using rule-based prioritisation. The experience should feel calm, grounded, and emotionally aware.

**What already exists:**
- Auth screen (magic code sign-in) — keep as-is
- `lib/db.ts` — Instant client, no changes needed
- `instant.schema.ts` — has a basic `todos` entity, needs replacement
- `instant.perms.ts` — needs `userContext` rules added
- `app/page.tsx` — old generic todo app, will be fully replaced

**Key decisions:**
- Persistence: InstantDB (cloud, tied to auth)
- "That counts": brief sparkle animation, then fade out (~1.5s)
- Task management: add, edit (name + time), delete, view completed, undo completion
- Calm mood: 1 avoid task (if any) + mix of short (≤15 min) and long (≥30 min), capped at 5

---

## Step 1 — Update the Schema

**File:** `instant.schema.ts`

```typescript
todos: i.entity({
  name: i.string().indexed(),
  timeEstimate: i.number().indexed(),  // 5 | 15 | 30 | 60
  tag: i.string().indexed(),           // "avoid" | (absent)
  done: i.boolean(),
  createdAt: i.number().indexed(),
  completedAt: i.number().indexed(),
}),
userContext: i.entity({
  lastMood: i.string(),   // "energised" | "overwhelmed" | "avoiding" | "calm"
  lastTime: i.number(),   // 5 | 15 | 30 | 60
  updatedAt: i.number(),
}),
```

Links:
```typescript
todoOwner: {
  forward: { on: "todos", has: "one", label: "owner" },
  reverse: { on: "$users", has: "many", label: "todos" },
},
userContextOwner: {
  forward: { on: "userContext", has: "one", label: "owner" },
  reverse: { on: "$users", has: "one", label: "context" },
},
```

Push via `mcp__instant__push-schema`.

---

## Step 2 — Update Permissions

**File:** `instant.perms.ts`

Add `userContext` rules (owner-only read/write), mirroring the todos pattern.

Push via `mcp__instant__push-perms`.

---

## Step 3 — Prioritisation Engine

**New file:** `lib/taskFilter.ts`

| Mood | Logic |
|---|---|
| overwhelmed | Smallest tasks first, cap 3 |
| avoiding | 1 avoid task + 2 smallest regular, cap 3 |
| energised | Largest tasks first, cap 5 |
| calm | 1 avoid + up to 2 short (≤15 min) + up to 2 long (≥30 min), cap 5 |

Edge case: eligible empty → show "Nothing fits this moment. Add something small?"

---

## Step 4 — Screen Architecture

```
app/page.tsx
  └─ <AuthScreen />
  └─ <AppShell userId />
       ├─ screen="context"   → <ContextScreen />
       ├─ screen="tasks"     → <TaskView />
       │                          └─ <TaskCard />
       │                          └─ <AddTaskSheet />  (overlay)
       └─ screen="completed" → <CompletedView />
```

`AppShell` owns `screen` state, always starts at `"context"` on load.

---

## Step 5 — Context Screen (`app/components/ContextScreen.tsx`)

**Fresh (no prior context):**
- "How are you feeling right now?"
- 2×2 mood grid: Energised ⚡ / Overwhelmed 🌊 / Avoiding 👀 / Calm 🌿
- Then time pills: 5 / 15 / 30 / 60+ min
- CTA: "Show me what I can do" → save to InstantDB + navigate to tasks

**Returning (context exists):**
- "You were feeling [Mood] with [X] mins. Is that still true?"
- [Yes, let's go] → navigate to tasks
- [Update] → show fresh selector

---

## Step 6 — Task View (`app/components/TaskView.tsx`)

- Top: mood + time chips + "Change" link
- Headline: "Here's what today can hold"
- 1–5 `<TaskCard />` components (output of `filterTasks()`)
- Bottom bar: "+ Add task" | "View completed"
- Empty: "Nothing fits this moment. Add something small?" or "What's quietly waiting for you?"

---

## Step 7 — Task Card (`app/components/TaskCard.tsx`)

- Task name (tap → inline edit)
- Time badge pill (tap → picker)
- 👀 icon if avoid-tagged
- ✨ "That counts" full-width button
- Hover/long-press → delete icon

**"That counts" animation:**
1. Card flashes warm (`bg-amber-50`)
2. "That counts." pulses for 1.2s
3. Card fades out + height collapses
4. `db.transact(update({ done: true, completedAt: Date.now() }))`

---

## Step 8 — Add Task Sheet (`app/components/AddTaskSheet.tsx`)

- Slides up from bottom (mobile) / centered modal (desktop)
- Task name input (auto-focused)
- Time pill buttons: 5 / 15 / 30 / 60+ min
- After name entered: "Is this something you've been putting off?" [Yes] / [No]
  - Yes → `tag: "avoid"`

---

## Step 9 — Completed View (`app/components/CompletedView.tsx`)

- "What you've done" header + back arrow
- List sorted by `completedAt` desc
- Per row: task name + time badge + date
- Actions: Undo | Delete

---

## Step 10 — Wire `app/page.tsx`

```typescript
export default function Home() {
  const { isLoading, user, error } = db.useAuth();
  if (isLoading) return <Loader />;
  if (error) return <ErrorView />;
  if (!user) return <AuthScreen />;
  return <AppShell userId={user.id} />;
}
```

---

## Microcopy

| Location | String |
|---|---|
| Completion button | "That counts." |
| Task view subtitle | "We're not doing everything. Just this." |
| Overwhelmed/5min empty | "You can start small." |
| First-time empty | "What's quietly waiting for you?" |

---

## Files to Create / Modify

| File | Action |
|---|---|
| `instant.schema.ts` | Replace |
| `instant.perms.ts` | Update |
| `lib/taskFilter.ts` | Create |
| `app/page.tsx` | Replace |
| `app/components/ContextScreen.tsx` | Create |
| `app/components/TaskView.tsx` | Create |
| `app/components/TaskCard.tsx` | Create |
| `app/components/AddTaskSheet.tsx` | Create |
| `app/components/CompletedView.tsx` | Create |
