"use client";

import { useState, useEffect, useRef } from "react";
import { db } from "@/lib/db";
import { id } from "@instantdb/react";

const TIME_OPTIONS = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60+ min" },
] as const;

interface Props {
  userId: string;
  onClose: () => void;
}

export default function AddTaskSheet({ userId, onClose }: Props) {
  const [name, setName] = useState("");
  const [timeEstimate, setTimeEstimate] = useState<number | null>(null);
  const [askedAvoid, setAskedAvoid] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleNext(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !timeEstimate) return;
    setAskedAvoid(true);
  }

  async function handleSave(isAvoid: boolean) {
    if (!name.trim() || !timeEstimate) return;
    setSaving(true);
    const todoId = id();
    await db.transact(
      db.tx.todos[todoId]
        .update({
          name: name.trim(),
          timeEstimate,
          tag: isAvoid ? "avoid" : "",
          done: false,
          createdAt: Date.now(),
          completedAt: 0,
        })
        .link({ owner: userId })
    );
    onClose();
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet: slides up on mobile, centered modal on md+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        className="fixed inset-x-0 bottom-0 md:inset-0 md:flex md:items-center md:justify-center z-50"
      >
        <div className="w-full md:max-w-sm md:mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl md:rounded-2xl shadow-xl p-6 flex flex-col gap-5">
          {/* Drag handle (mobile only) */}
          <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-700 rounded-full mx-auto md:hidden" aria-hidden="true" />

          <h2 id="add-task-title" className="text-lg font-semibold text-stone-700 dark:text-zinc-100">
            Add a task
          </h2>

          {!askedAvoid ? (
            <form onSubmit={handleNext} className="flex flex-col gap-4">
              <input
                ref={inputRef}
                type="text"
                placeholder="What needs doing?"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
              />

              <div>
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                  How long will it take?
                </p>
                <div className="flex gap-2 flex-wrap">
                  {TIME_OPTIONS.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setTimeEstimate(value)}
                      aria-pressed={timeEstimate === value}
                      aria-label={label}
                      className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-1 ${
                        timeEstimate === value
                          ? "bg-violet-500 border-violet-500 text-white"
                          : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-violet-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!name.trim() || !timeEstimate}
                  className="flex-1 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                >
                  Next
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                Is{" "}
                <span className="font-semibold text-zinc-800 dark:text-zinc-100">
                  "{name}"
                </span>{" "}
                something you've been putting off?
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSave(true)}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm font-medium hover:bg-amber-100 dark:hover:bg-amber-950/50 transition-colors disabled:opacity-50"
                >
                  👀 Yes, it is
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="w-full py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  No, just a task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
