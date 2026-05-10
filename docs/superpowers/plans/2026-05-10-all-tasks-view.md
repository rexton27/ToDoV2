# All Tasks View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "For you / All tasks" tab toggle to the task screen, where "All tasks" shows every active todo in a compact, fully-editable table row.

**Architecture:** Tab state (`"foryou" | "all"`) lives in `TaskView`. When "All tasks" is active, `TaskView` renders a new `AllTasksView` component instead of the filtered card list. `AllTasksView` owns its own query and per-row editing state; no shared state with the card view.

**Tech Stack:** Next.js 16 App Router, React 19, InstantDB (`@instantdb/react`), Tailwind CSS v4, TypeScript.

> **Note:** This project has no test suite. Skip TDD steps — implement directly and verify in the browser with `npm run dev` from `todov2/`.

---

## Files

| File | Action |
|---|---|
| `todov2/app/components/AllTasksView.tsx` | Create — table view component |
| `todov2/app/components/TaskView.tsx` | Modify — add tab state, tab bar, conditional render |

---

### Task 1: Create `AllTasksView`

**File:** Create `todov2/app/components/AllTasksView.tsx`

- [ ] **Step 1: Create the file with the full component**

```tsx
"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Todo = InstaQLEntity<AppSchema, "todos">;

const TIME_OPTIONS = [5, 15, 30, 60] as const;

function timeLabel(t: number) {
  return t === 60 ? "60+ min" : `${t} min`;
}

interface Props {
  userId: string;
  onViewCompleted: () => void;
  onAddTask: () => void;
}

export default function AllTasksView({ userId, onViewCompleted, onAddTask }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [pickingTimeId, setPickingTimeId] = useState<string | null>(null);

  const { data, isLoading } = db.useQuery({
    todos: {
      $: {
        where: { "owner.id": userId },
        order: { createdAt: "asc" },
      },
    },
  });

  const todos = (data?.todos ?? []).filter((t) => !t.done);

  function startEdit(todo: Todo) {
    setPickingTimeId(null);
    setEditingId(todo.id);
    setEditName(todo.name);
  }

  function commitEdit(todo: Todo) {
    const name = editName.trim();
    if (name && name !== todo.name) {
      db.transact(db.tx.todos[todo.id].update({ name }));
    }
    setEditingId(null);
  }

  function commitTime(todo: Todo, t: number) {
    db.transact(db.tx.todos[todo.id].update({ timeEstimate: t }));
    setPickingTimeId(null);
  }

  function completeTodo(todo: Todo) {
    db.transact(db.tx.todos[todo.id].update({ done: true, completedAt: Date.now() }));
  }

  function deleteTodo(todo: Todo) {
    db.transact(db.tx.todos[todo.id].delete());
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          What's quietly waiting for you?
        </p>
        <button
          onClick={onAddTask}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
        >
          + Add task
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
        {/* Column headers */}
        <div className="grid grid-cols-[1fr_64px_64px_52px] gap-2 px-4 py-2 bg-stone-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800">
          {["Task", "Time", "Tag", ""].map((h) => (
            <span
              key={h}
              className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {todos.map((todo) => {
          const isEditing = editingId === todo.id;
          const isPickingTime = pickingTimeId === todo.id;

          return (
            <div
              key={todo.id}
              className={`grid grid-cols-[1fr_64px_64px_52px] gap-2 items-center px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-b-0 transition-colors ${
                isEditing
                  ? "bg-violet-50 dark:bg-violet-950/20"
                  : "bg-white dark:bg-zinc-900"
              }`}
            >
              {/* Name */}
              {isEditing ? (
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => commitEdit(todo)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit(todo);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  autoFocus
                  className="text-sm font-medium text-zinc-800 dark:text-zinc-100 bg-transparent border-b border-violet-400 focus:outline-none pb-0.5 w-full font-[inherit]"
                />
              ) : (
                <button
                  onClick={() => startEdit(todo)}
                  className="text-left text-sm font-medium text-zinc-800 dark:text-zinc-100 hover:text-violet-600 dark:hover:text-violet-400 transition-colors truncate"
                >
                  {todo.name}
                </button>
              )}

              {/* Time — picker inline */}
              {isPickingTime ? (
                <div className="flex flex-wrap gap-1 col-span-1">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => commitTime(todo, t)}
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium border transition-all ${
                        todo.timeEstimate === t
                          ? "bg-violet-600 border-violet-600 text-white"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:border-violet-400"
                      }`}
                    >
                      {t === 60 ? "60+" : t}
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setEditingId(null);
                    setPickingTimeId(todo.id);
                  }}
                  className={`justify-self-start px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                    isEditing
                      ? "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-600 dark:hover:text-violet-400"
                  }`}
                >
                  {timeLabel(todo.timeEstimate)}
                </button>
              )}

              {/* Tag */}
              {todo.tag === "avoid" ? (
                <span className="justify-self-start px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                  👀 avoid
                </span>
              ) : (
                <span className="text-xs text-zinc-300 dark:text-zinc-600 text-center">—</span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 justify-end">
                <button
                  onClick={() => completeTodo(todo)}
                  title="Mark done"
                  className="w-[22px] h-[22px] rounded-full border-[1.5px] border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-zinc-300 dark:text-zinc-600 hover:border-violet-500 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-all flex-shrink-0"
                >
                  <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => deleteTodo(todo)}
                  title="Delete"
                  className="text-zinc-300 dark:text-zinc-600 hover:text-red-400 transition-colors text-base leading-none flex-shrink-0"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onAddTask}
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            + Add task
          </button>
          <button
            onClick={onViewCompleted}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            View completed
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the file was created**

```bash
ls todov2/app/components/
```
Expected: `AllTasksView.tsx` appears in the list.

- [ ] **Step 3: Commit**

```bash
git add todov2/app/components/AllTasksView.tsx
git commit -m "feat: add AllTasksView table component"
```

---

### Task 2: Wire tab toggle into `TaskView`

**File:** Modify `todov2/app/components/TaskView.tsx`

- [ ] **Step 1: Add the `AllTasksView` import and `tab` state**

At the top of the file, add the import after the existing imports:

```tsx
import AllTasksView from "./AllTasksView";
```

Inside `TaskView`, add `tab` state directly after the existing `showAdd` state:

```tsx
const [tab, setTab] = useState<"foryou" | "all">("foryou");
```

- [ ] **Step 2: Add the tab bar between the header and main**

Replace the `{/* Main */}` block's opening so the tab bar sits between header and main. The full updated return should be:

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
        <button
          onClick={onChangeContext}
          className="text-xs text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400 font-medium transition-colors"
        >
          Change
        </button>
      </div>
    </header>

    {/* Tab bar */}
    <div className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
      <div className="max-w-lg mx-auto px-6 flex">
        {(["foryou", "all"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2.5 px-1 mr-5 text-sm font-medium border-b-2 transition-colors ${
              tab === t
                ? "border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400"
                : "border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300"
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
            <h1 className="text-xl font-semibold text-zinc-800 dark:text-zinc-100">
              Here's what today can hold
            </h1>
            <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-1">
              We're not doing everything. Just this.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">{emptyMessage}</p>
              <button
                onClick={() => setShowAdd(true)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium transition-colors"
              >
                + Add task
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {tasks.map((todo) => (
                <TaskCard key={todo.id} todo={todo} />
              ))}
            </div>
          )}
        </>
      )}
    </main>

    {/* Bottom bar — For you tab only (All tasks has its own inline bar) */}
    {tab === "foryou" && !isLoading && tasks.length > 0 && (
      <footer className="bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-lg mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={() => setShowAdd(true)}
            className="text-sm font-medium text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
          >
            + Add task
          </button>
          <button
            onClick={onViewCompleted}
            className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
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

- [ ] **Step 3: Run the type check**

```bash
cd todov2 && npx tsc --noEmit
```
Expected: no output (clean).

- [ ] **Step 4: Start the dev server and verify in the browser**

```bash
cd todov2 && npm run dev
```

Open http://localhost:3000, sign in, pick a mood + time. Verify:
- "For you / All tasks" tabs appear below the mood/time chips
- "For you" tab shows the filtered card list (unchanged)
- "All tasks" tab shows the table with Task / Time / Tag / Actions columns
- Tapping a task name makes it editable inline; Enter/blur saves, Escape cancels
- Tapping the time pill opens the mini picker; selecting a value saves immediately
- Checkmark ○ button marks the task done and removes it from the list
- × button deletes the task
- "+ Add task" and "View completed" links both work from the All tasks tab

- [ ] **Step 5: Commit**

```bash
git add todov2/app/components/TaskView.tsx
git commit -m "feat: add For you / All tasks tab toggle to TaskView"
```
