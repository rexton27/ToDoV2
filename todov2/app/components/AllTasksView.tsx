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
        <p className="text-sm text-stone-400 dark:text-zinc-500">
          What's quietly waiting for you?
        </p>
        <button
          onClick={onAddTask}
          className="px-4 py-2 rounded-xl bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
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
          {["Task", "Time", "Tag", ""].map((h, i) => (
            <span
              key={i}
              className="text-[10px] font-semibold text-stone-400 dark:text-zinc-500 uppercase tracking-wider"
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
                isEditing || isPickingTime
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
                    if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                    if (e.key === "Escape") {
                      setEditName(todo.name);
                      setEditingId(null);
                    }
                  }}
                  autoFocus
                  aria-label="Edit task name"
                  className="text-sm font-normal text-stone-700 dark:text-zinc-100 bg-transparent border-b border-violet-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-violet-400 pb-0.5 w-full font-[inherit]"
                />
              ) : (
                <button
                  onClick={() => startEdit(todo)}
                  className="text-left text-sm font-normal text-stone-700 dark:text-zinc-100 hover:text-violet-500 dark:hover:text-violet-400 transition-colors duration-200 truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded-sm"
                >
                  {todo.name}
                </button>
              )}

              {/* Time / Tag / Actions */}
              {isPickingTime ? (
                // Picker spans Time + Tag + Actions columns
                <div className="col-span-3 flex flex-wrap gap-1 items-center">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => commitTime(todo, t)}
                      aria-label={`Set time to ${t === 60 ? "60+ minutes" : `${t} minutes`}`}
                      aria-pressed={todo.timeEstimate === t}
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
                        todo.timeEstimate === t
                          ? "bg-violet-500 border-violet-500 text-white"
                          : "border-stone-200 dark:border-zinc-700 text-stone-500 hover:border-violet-400"
                      }`}
                    >
                      {t === 60 ? "60+" : `${t}`}
                    </button>
                  ))}
                  <button
                    onClick={() => setPickingTimeId(null)}
                    aria-label="Close time picker"
                    className="text-xs text-stone-400 hover:text-stone-600 px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <>
                  {/* Time pill */}
                  <button
                    onClick={() => {
                      setEditingId(null);
                      setPickingTimeId(todo.id);
                    }}
                    aria-label={`Time estimate: ${timeLabel(todo.timeEstimate ?? 5)}. Tap to change.`}
                    className={`justify-self-start px-2 py-0.5 rounded-full text-xs font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
                      isEditing
                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-500 dark:text-violet-400"
                        : "bg-stone-100 dark:bg-zinc-800 text-stone-500 dark:text-zinc-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-500 dark:hover:text-violet-400"
                    }`}
                  >
                    {timeLabel(todo.timeEstimate ?? 5)}
                  </button>

                  {/* Tag */}
                  {todo.tag === "avoid" ? (
                    <span className="justify-self-start px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 whitespace-nowrap">
                      👀 avoid
                    </span>
                  ) : (
                    <span className="text-xs text-stone-300 dark:text-zinc-600 text-center" aria-hidden="true">—</span>
                  )}

                  {/* Actions — larger tap targets via group/check pattern */}
                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => completeTodo(todo)}
                      aria-label="Mark complete"
                      className="group/check flex items-center justify-center w-10 h-10 -mr-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded-full"
                    >
                      <span className="w-[22px] h-[22px] rounded-full border-[1.5px] border-stone-300 dark:border-zinc-600 flex items-center justify-center text-stone-300 dark:text-zinc-600 group-hover/check:border-violet-500 group-hover/check:text-violet-500 group-hover/check:bg-violet-50 dark:group-hover/check:bg-violet-950/30 transition-all duration-200">
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
                      onClick={() => deleteTodo(todo)}
                      aria-label="Delete task"
                      className="flex items-center justify-center w-10 h-10 -mr-1 text-stone-300 dark:text-zinc-600 hover:text-red-400 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 rounded-full text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom bar */}
      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onAddTask}
            className="text-sm font-medium text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded"
          >
            + Add task
          </button>
          <button
            onClick={onViewCompleted}
            className="text-sm text-stone-400 hover:text-stone-600 dark:hover:text-zinc-300 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 rounded"
          >
            View completed
          </button>
        </div>
      </div>
    </div>
  );
}
