"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { filterTasks } from "@/lib/taskFilter";
import type { Mood, TimeOption } from "@/lib/taskFilter";
import TaskCard from "./TaskCard";
import AddTaskSheet from "./AddTaskSheet";
import AllTasksView from "./AllTasksView";

const MOOD_META: Record<Mood, { label: string; emoji: string }> = {
  energised: { label: "Energised", emoji: "⚡" },
  overwhelmed: { label: "Overwhelmed", emoji: "🌊" },
  avoiding: { label: "Avoiding", emoji: "👀" },
  calm: { label: "Calm", emoji: "🌿" },
};

interface Props {
  userId: string;
  mood: Mood;
  time: TimeOption;
  onChangeContext: () => void;
  onViewCompleted: () => void;
}

export default function TaskView({
  userId,
  mood,
  time,
  onChangeContext,
  onViewCompleted,
}: Props) {
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<"foryou" | "all">("foryou");

  const { data, isLoading } = db.useQuery({
    todos: {
      $: {
        where: { "owner.id": userId },
        order: { createdAt: "asc" },
      },
    },
  });

  const allTodos = data?.todos ?? [];
  const tasks = filterTasks(allTodos, mood);
  const { label, emoji } = MOOD_META[mood];

  const hasAnyActive = allTodos.some((t) => !t.done);
  const emptyMessage =
    !hasAnyActive
      ? "What's quietly waiting for you?"
      : mood === "overwhelmed" && time === 5
      ? "You can start small."
      : "Nothing fits this moment. Add something small?";

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
              className={`py-2.5 px-1 mr-5 text-sm font-medium border-b-2 transition-colors duration-200 ${
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

      {/* Bottom bar — For you tab only (All tasks has its own inline bar) */}
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
}
