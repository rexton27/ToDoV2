"use client";

import { useState } from "react";
import { db } from "@/lib/db";
import type { Mood, TimeOption } from "@/lib/taskFilter";
import ContextScreen from "./components/ContextScreen";
import TaskView from "./components/TaskView";
import CompletedView from "./components/CompletedView";

type Screen = "context" | "tasks" | "completed";

// ─── Root ────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) return <Loader />;
  if (error) return <ErrorView message={error.message} />;
  if (!user) return <AuthScreen />;
  return <AppShell userId={user.id} />;
}

// ─── App Shell ───────────────────────────────────────────────────────────────

function AppShell({ userId }: { userId: string }) {
  const [screen, setScreen] = useState<Screen>("context");

  const { data } = db.useQuery({
    userContext: {
      $: { where: { "owner.id": userId } },
    },
  });

  const ctx = data?.userContext?.[0];

  if (screen === "tasks" && ctx) {
    return (
      <TaskView
        userId={userId}
        mood={ctx.lastMood as Mood}
        time={ctx.lastTime as TimeOption}
        onChangeContext={() => setScreen("context")}
        onViewCompleted={() => setScreen("completed")}
      />
    );
  }

  if (screen === "completed") {
    return (
      <CompletedView userId={userId} onBack={() => setScreen("tasks")} />
    );
  }

  return (
    <ContextScreen userId={userId} onNavigate={() => setScreen("tasks")} />
  );
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setSentTo(email.trim());
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send code");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!code.trim() || !sentTo) return;
    setLoading(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email: sentTo, code: code.trim() });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid code");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M8 3v10" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
            ToDoV2
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-8">
          {!sentTo ? (
            <>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                Welcome back
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Enter your email to sign in or create an account.
              </p>
              <form onSubmit={sendCode} className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {loading ? "Sending…" : "Continue with email"}
                </button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50 mb-1">
                Check your inbox
              </h1>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                We sent a 6-digit code to{" "}
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{sentTo}</span>.
              </p>
              <form onSubmit={verifyCode} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  maxLength={6}
                  className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-stone-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition tracking-widest font-mono"
                  required
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={loading || code.length < 6}
                  className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {loading ? "Verifying…" : "Sign in"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSentTo(null);
                    setCode("");
                    setError(null);
                  }}
                  className="text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors text-center"
                >
                  Use a different email
                </button>
              </form>
            </>
          )}

          {error && <p className="mt-4 text-sm text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Loader() {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30 p-8 max-w-sm w-full text-center">
        <p className="text-sm text-red-500">{message}</p>
      </div>
    </div>
  );
}
