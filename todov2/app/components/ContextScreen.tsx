"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import { id, InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import type { Mood, TimeOption } from "@/lib/taskFilter";

type UserContext = InstaQLEntity<AppSchema, "userContext">;

const MOODS: { value: Mood; label: string; emoji: string }[] = [
  { value: "energised", label: "Energised", emoji: "⚡" },
  { value: "overwhelmed", label: "Overwhelmed", emoji: "🌊" },
  { value: "avoiding", label: "Avoiding", emoji: "👀" },
  { value: "calm", label: "Calm", emoji: "🌿" },
];

const TIME_OPTIONS: { value: TimeOption; label: string }[] = [
  { value: 5, label: "5 min" },
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 60, label: "60+ min" },
];

interface Props {
  userId: string;
  onNavigate: () => void;
}

export default function ContextScreen({ userId, onNavigate }: Props) {
  const { data } = db.useQuery({
    userContext: {
      $: { where: { "owner.id": userId } },
    },
  });

  const existing = data?.userContext?.[0];

  if (existing) {
    return (
      <ReturningView
        context={existing}
        userId={userId}
        onNavigate={onNavigate}
      />
    );
  }

  return <FreshSelector userId={userId} onNavigate={onNavigate} contextId={undefined} />;
}

function ReturningView({
  context,
  userId,
  onNavigate,
}: {
  context: UserContext;
  userId: string;
  onNavigate: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const moodMeta = MOODS.find((m) => m.value === context.lastMood);

  if (updating) {
    return (
      <FreshSelector userId={userId} onNavigate={onNavigate} contextId={context.id} />
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <div>
          <p className="text-xs font-medium text-violet-500 uppercase tracking-widest mb-3">
            Welcome back
          </p>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100 leading-snug">
            You were feeling{" "}
            <span className="text-violet-600">
              {moodMeta?.emoji} {moodMeta?.label ?? context.lastMood}
            </span>{" "}
            with {context.lastTime === 60 ? "60+" : context.lastTime} mins.
          </h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Is that still true?
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <button
            onClick={onNavigate}
            className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-medium text-sm transition-colors"
          >
            Yes, let's go
          </button>
          <button
            onClick={() => setUpdating(true)}
            className="w-full py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}

function FreshSelector({
  userId,
  onNavigate,
  contextId,
}: {
  userId: string;
  onNavigate: () => void;
  contextId: string | undefined;
}) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [time, setTime] = useState<TimeOption | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    if (!mood || !time) return;
    setSaving(true);
    const ctxId = contextId ?? id();
    await db.transact(
      db.tx.userContext[ctxId]
        .update({ lastMood: mood, lastTime: time, updatedAt: Date.now() })
        .link({ owner: userId })
    );
    onNavigate();
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div>
          <p className="text-xs font-medium text-violet-500 uppercase tracking-widest mb-3">
            Check in
          </p>
          <h1 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-100">
            How are you feeling right now?
          </h1>
        </div>

        {/* Mood 2×2 grid */}
        <div className="grid grid-cols-2 gap-3">
          {MOODS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setMood(value)}
              className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl border-2 text-left transition-all ${
                mood === value
                  ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30"
                  : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-violet-200 dark:hover:border-violet-800"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span
                className={`text-sm font-medium ${
                  mood === value
                    ? "text-violet-700 dark:text-violet-300"
                    : "text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {label}
              </span>
            </button>
          ))}
        </div>

        {/* Time pills — appear after mood selected */}
        {mood && (
          <div className="flex flex-col gap-3">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              How much time do you have?
            </p>
            <div className="flex gap-2 flex-wrap">
              {TIME_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setTime(value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    time === value
                      ? "bg-violet-600 border-violet-600 text-white"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-violet-400 dark:hover:border-violet-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!mood || !time || saving}
          className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-all"
        >
          {saving ? "Getting ready…" : "Show me what I can do"}
        </button>
      </div>
    </div>
  );
}
