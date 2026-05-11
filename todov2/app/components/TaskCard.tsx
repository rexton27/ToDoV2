"use client";

import { useState, useRef } from "react";
import { db } from "@/lib/db";
import { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Todo = InstaQLEntity<AppSchema, "todos">;

const TIME_OPTIONS = [5, 15, 30, 60] as const;

interface Props {
  todo: Todo;
}

export default function TaskCard({ todo }: Props) {
  const [fading, setFading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(todo.name);
  const [pickingTime, setPickingTime] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  function handleComplete() {
    setFading(true);
    setTimeout(() => {
      db.transact(db.tx.todos[todo.id].update({ done: true, completedAt: Date.now() }));
    }, 350);
  }

  function handleDelete() {
    db.transact(db.tx.todos[todo.id].delete());
  }

  function commitName() {
    const name = editName.trim();
    if (name && name !== todo.name) {
      db.transact(db.tx.todos[todo.id].update({ name }));
    } else {
      setEditName(todo.name);
    }
    setEditing(false);
  }

  function commitTime(t: number) {
    db.transact(db.tx.todos[todo.id].update({ timeEstimate: t }));
    setPickingTime(false);
  }

  return (
    <div
      className={`group relative rounded-2xl bg-white dark:bg-zinc-900 shadow-[0_1px_6px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300 motion-reduce:transition-none ${
        fading ? "opacity-0 scale-95 motion-reduce:opacity-0 motion-reduce:scale-100 pointer-events-none" : ""
      }`}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Name row */}
        <div className="flex items-start gap-2">
          {todo.tag === "avoid" && (
            <span className="mt-0.5 text-base shrink-0" aria-label="Something you've been putting off">
              👀
            </span>
          )}

          <div className="flex-1 min-w-0">
            {editing ? (
              <input
                ref={nameInputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={commitName}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitName();
                  if (e.key === "Escape") {
                    setEditName(todo.name);
                    setEditing(false);
                  }
                }}
                autoFocus
                aria-label="Edit task name"
                className="w-full text-sm font-normal text-stone-700 dark:text-zinc-100 bg-transparent border-b border-violet-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400 pb-0.5"
              />
            ) : (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditName(todo.name);
                }}
                className="text-left text-sm font-normal text-stone-700 dark:text-zinc-100 hover:text-violet-500 dark:hover:text-violet-400 transition-colors duration-200 break-words w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded-sm"
              >
                {todo.name}
              </button>
            )}
          </div>

          {/* Actions — larger tap targets via p-2 -m-2 */}
          <div className="flex items-center gap-0 shrink-0">
            <button
              onClick={handleComplete}
              aria-label="Mark complete"
              className="group/check flex items-center justify-center w-11 h-11 -m-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded-full"
            >
              <span className="w-6 h-6 rounded-full border-[1.5px] border-stone-300 dark:border-zinc-600 flex items-center justify-center text-stone-300 dark:text-zinc-600 group-hover/check:border-violet-500 group-hover/check:text-violet-500 group-hover/check:bg-violet-50 dark:group-hover/check:bg-violet-950/30 transition-all duration-200">
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            <button
              onClick={handleDelete}
              aria-label="Delete task"
              className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-11 h-11 -m-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:opacity-100"
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-md text-stone-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2 2l8 8M10 2l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Time badge / picker */}
        {pickingTime ? (
          <div className="flex gap-1.5 flex-wrap">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => commitTime(t)}
                aria-label={`Set time to ${t === 60 ? "60+ minutes" : `${t} minutes`}`}
                aria-pressed={todo.timeEstimate === t}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
                  todo.timeEstimate === t
                    ? "bg-violet-500 border-violet-500 text-white"
                    : "border-stone-200 dark:border-zinc-700 text-stone-500 hover:border-violet-400"
                }`}
              >
                {t === 60 ? "60+ min" : `${t} min`}
              </button>
            ))}
            <button
              onClick={() => setPickingTime(false)}
              aria-label="Close time picker"
              className="px-2 py-1 text-xs text-stone-400 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPickingTime(true)}
            aria-label={`Time estimate: ${todo.timeEstimate === 60 ? "60+ minutes" : `${todo.timeEstimate} minutes`}. Tap to change.`}
            className="self-start px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-500 dark:hover:text-violet-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1"
          >
            {todo.timeEstimate === 60 ? "60+ min" : `${todo.timeEstimate} min`}
          </button>
        )}
      </div>
    </div>
  );
}
