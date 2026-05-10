# All Tasks View — Design Spec

**Date:** 2026-05-10
**Status:** Approved

---

## What we're building

A second way to view tasks alongside the existing mood-filtered "For you" view. A tab toggle in the task screen lets the user switch between:

- **For you** — the existing filtered, prioritised card list (unchanged)
- **All tasks** — a compact table showing every active task with all metadata visible, fully editable inline

---

## Navigation

The tab bar sits immediately below the mood/time header chips in `TaskView`. It replaces nothing — the header, bottom bar, and "View completed" link remain in place for both tabs.

Tab state lives inside `TaskView` as local `useState`. It resets to "For you" whenever the user navigates away (e.g. changes context or views completed), which is the right default — the prioritised view is the primary experience.

---

## All Tasks table

### Layout

Four columns per row: **Task name · Time · Tag · Actions**

Column widths are fixed (`1fr 60px 60px 52px`) so the table stays scannable at a glance.

### Rows

Each row shows one active (not done) todo. Ordered by `createdAt` ascending — the same default order as the card view.

| Element | Behaviour |
|---|---|
| Task name | Tapping opens an inline `<input>` with a violet underline. `Enter` or `blur` commits the edit. `Escape` cancels. |
| Time pill | Tapping cycles to a mini time-picker (same 4 options: 5 / 15 / 30 / 60+). Pill turns violet while active. |
| Tag badge | `👀 avoid` badge in amber if tagged; em-dash if untagged. Read-only in this view. |
| Checkmark ○ | Circular button. Tap marks the task done (`done: true`, `completedAt: Date.now()`). No flash animation — immediate. |
| Delete × | Deletes the task immediately. |

Active (editing) row gets a subtle lavender tint (`bg-violet-50`) to indicate focus.

### Completion behaviour

The table view uses direct completion — no "That counts." text, no flash animation. The row disappears from the list as soon as InstantDB updates. This suits the management/overview nature of the view.

The existing `TaskCard` in the "For you" tab keeps its full "That counts." animation unchanged.

### Empty state

If there are no active tasks: _"What's quietly waiting for you?"_ with an "+ Add task" button — same pattern as the card view.

---

## Architecture

### New file

**`app/components/AllTasksView.tsx`**

Standalone component. Receives `userId`. Owns its own `db.useQuery` for all active todos (filters `done: false` client-side, as per the existing pattern). Handles inline editing state per-row via a single `editingId: string | null` state.

### Modified file

**`app/components/TaskView.tsx`**

Add `tab: "foryou" | "all"` state (default `"foryou"`). Render the tab bar between the header and the main content area. When `tab === "all"`, render `<AllTasksView userId={userId} />` instead of the filtered card list. The bottom bar (add task / view completed) renders for both tabs.

No changes to `AppShell`, `page.tsx`, `TaskCard`, or any other file.

---

## Files to create / modify

| File | Action |
|---|---|
| `app/components/AllTasksView.tsx` | Create |
| `app/components/TaskView.tsx` | Update — add tab state + tab bar + conditional render |
