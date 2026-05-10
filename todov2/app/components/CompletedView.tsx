"use client";

import { db } from "@/lib/db";
import { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Todo = InstaQLEntity<AppSchema, "todos">;

interface Props {
  userId: string;
  onBack: () => void;
}

function formatDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function timeLabel(t: number) {
  return t === 60 ? "60+ min" : `${t} min`;
}

export default function CompletedView({ userId, onBack }: Props) {
  const { data, isLoading } = db.useQuery({
    todos: {
      $: {
        where: { "owner.id": userId },
        order: { completedAt: "desc" },
      },
    },
  });

  const completed = (data?.todos ?? [])
    .filter((t) => t.done)
    .sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));

  function handleUndo(todo: Todo) {
    db.transact(db.tx.todos[todo.id].update({ done: false, completedAt: 0 }));
  }

  function handleDelete(todo: Todo) {
    db.transact(db.tx.todos[todo.id].delete());
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M10 3L5 8l5 5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-zinc-800 dark:text-zinc-100">
            What you've done
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-6 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
          </div>
        ) : completed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-2">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">Nothing completed yet.</p>
            <p className="text-xs text-zinc-300 dark:text-zinc-600">
              Hit "That counts." on a task to see it here.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {completed.map((todo) => (
              <li
                key={todo.id}
                className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 px-4 py-3 flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 line-through truncate">
                    {todo.name}
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                    {timeLabel(todo.timeEstimate)} · {formatDate(todo.completedAt)}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleUndo(todo)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => handleDelete(todo)}
                    className="px-2.5 py-1 text-xs font-medium rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
