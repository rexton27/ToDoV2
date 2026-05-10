"use client";

import { useState, useRef } from "react";
import { db } from "@/lib/db";
import { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Todo = InstaQLEntity<AppSchema, "todos">;

const TIME_OPTIONS = [5, 15, 30, 60] as const;

type AnimState = "idle" | "flash" | "fading";

interface Props {
  todo: Todo;
}

export default function TaskCard({ todo }: Props) {
  const [animState, setAnimState] = useState<AnimState>("idle");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(todo.name);
  const [pickingTime, setPickingTime] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  function handleThatCounts() {
    setAnimState("flash");
    setTimeout(() => setAnimState("fading"), 1200);
    // Transact after the fade completes so InstantDB doesn't unmount mid-animation
    setTimeout(() => {
      db.transact(db.tx.todos[todo.id].update({ done: true, completedAt: Date.now() }));
    }, 1600);
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

  const isFlashing = animState === "flash";
  const isFading = animState === "fading";

  return (
    <div
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 ${
        isFlashing
          ? "bg-amber-50 dark:bg-amber-950/30 shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
          : isFading
          ? "opacity-0 scale-95 pointer-events-none"
          : "bg-white dark:bg-zinc-900 shadow-[0_1px_6px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="p-5 flex flex-col gap-3">
        {/* Name row */}
        <div className="flex items-start gap-2">
          {todo.tag === "avoid" && (
            <span className="mt-0.5 text-base shrink-0" title="Something you've been putting off">
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
                className="w-full text-sm font-normal text-stone-700 dark:text-zinc-100 bg-transparent border-b border-violet-400 focus:outline-none pb-0.5"
              />
            ) : (
              <button
                onClick={() => {
                  setEditing(true);
                  setEditName(todo.name);
                }}
                className="text-left text-sm font-normal text-stone-700 dark:text-zinc-100 hover:text-violet-500 dark:hover:text-violet-400 transition-colors duration-200 break-words"
              >
                {todo.name}
              </button>
            )}
          </div>

          {/* Delete — visible on hover */}
          <button
            onClick={handleDelete}
            className="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-zinc-300 hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 2l8 8M10 2l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Time badge / picker */}
        {pickingTime ? (
          <div className="flex gap-1.5 flex-wrap">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                onClick={() => commitTime(t)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-200 ${
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
              className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-600"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPickingTime(true)}
            className="self-start px-2.5 py-1 rounded-full text-xs font-medium bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-500 dark:hover:text-violet-400 transition-colors duration-200"
          >
            {todo.timeEstimate === 60 ? "60+ min" : `${todo.timeEstimate} min`}
          </button>
        )}

        {/* That counts button */}
        {isFlashing ? (
          <div className="w-full py-2.5 text-center text-sm font-semibold text-amber-600 dark:text-amber-400 animate-pulse">
            That counts. ✨
          </div>
        ) : (
          <button
            onClick={handleThatCounts}
            disabled={isFading}
            className="w-full py-2.5 rounded-xl bg-stone-100 dark:bg-zinc-800 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-stone-500 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 text-sm font-medium transition-all duration-200"
          >
            ✓ That counts.
          </button>
        )}
      </div>
    </div>
  );
}
