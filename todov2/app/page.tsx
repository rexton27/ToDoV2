"use client";

import { useState, useRef, FormEvent, KeyboardEvent } from "react";
import { db } from "@/lib/db";
import { id, InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

type Todo = InstaQLEntity<AppSchema, "todos">;
type Filter = "all" | "active" | "done";

// ─── Root ────────────────────────────────────────────────────────────────────

export default function Home() {
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) return <Loader />;
  if (error) return <ErrorView message={error.message} />;
  if (!user) return <AuthScreen />;
  return <TodoApp userId={user.id} email={user.email ?? ""} />;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode(e: FormEvent) {
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

  async function verifyCode(e: FormEvent) {
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
        {/* Logo mark */}
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 8h10M8 3v10"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
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
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {sentTo}
                </span>
                .
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

          {error && (
            <p className="mt-4 text-sm text-red-500 text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

function TodoApp({ userId, email }: { userId: string; email: string }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = db.useQuery({
    todos: {
      $: {
        where: { "owner.id": userId },
        order: { createdAt: "asc" },
      },
    },
  });

  const todos = data?.todos ?? [];
  const activeTodos = todos.filter((t) => !t.done);
  const doneTodos = todos.filter((t) => t.done);

  const filtered =
    filter === "active"
      ? activeTodos
      : filter === "done"
        ? doneTodos
        : todos;

  function addTodo() {
    const text = inputText.trim();
    if (!text) return;
    const todoId = id();
    db.transact(
      db.tx.todos[todoId]
        .update({ text, done: false, createdAt: Date.now() })
        .link({ owner: userId })
    );
    setInputText("");
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") addTodo();
  }

  function toggleTodo(todo: Todo) {
    db.transact(db.tx.todos[todo.id].update({ done: !todo.done }));
  }

  function deleteTodo(todoId: string) {
    db.transact(db.tx.todos[todoId].delete());
  }

  function clearDone() {
    db.transact(doneTodos.map((t) => db.tx.todos[t.id].delete()));
  }

  function toggleAll() {
    const allDone = activeTodos.length === 0 && todos.length > 0;
    db.transact(todos.map((t) => db.tx.todos[t.id].update({ done: !allDone })));
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 8h10M8 3v10"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className="font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight">
              ToDoV2
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-zinc-400 dark:text-zinc-500 hidden sm:block">
              {email}
            </span>
            <button
              onClick={() => db.auth.signOut()}
              className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors font-medium"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-8 flex flex-col gap-6">
        {/* Input */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-4 flex items-center gap-3">
          {todos.length > 0 && (
            <button
              onClick={toggleAll}
              title="Toggle all"
              className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-zinc-300 dark:border-zinc-600 hover:border-violet-500 transition-colors flex items-center justify-center group"
            >
              {activeTodos.length === 0 && (
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  fill="none"
                  className="text-violet-500"
                >
                  <path
                    d="M1.5 5L4 7.5L8.5 2.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}
          <input
            ref={inputRef}
            type="text"
            placeholder="What needs to be done?"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-50 text-sm placeholder:text-zinc-400 focus:outline-none"
            autoFocus
          />
          <button
            onClick={addTodo}
            disabled={!inputText.trim()}
            className="flex-shrink-0 w-7 h-7 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1v10M1 6h10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* Todo list */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 overflow-hidden">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-violet-200 border-t-violet-500 rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                {filter === "all"
                  ? "No todos yet. Add one above!"
                  : filter === "active"
                    ? "No active todos."
                    : "Nothing completed yet."}
              </p>
            </div>
          ) : (
            <ul>
              {filtered.map((todo, i) => (
                <TodoRow
                  key={todo.id}
                  todo={todo}
                  isLast={i === filtered.length - 1}
                  onToggle={() => toggleTodo(todo)}
                  onDelete={() => deleteTodo(todo.id)}
                />
              ))}
            </ul>
          )}

          {/* Footer */}
          {todos.length > 0 && (
            <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                {activeTodos.length}{" "}
                {activeTodos.length === 1 ? "item" : "items"} left
              </span>

              {/* Filters */}
              <div className="flex items-center gap-1">
                {(["all", "active", "done"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors capitalize ${
                      filter === f
                        ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                        : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <button
                onClick={clearDone}
                disabled={doneTodos.length === 0}
                className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 disabled:opacity-0 disabled:pointer-events-none transition-colors"
              >
                Clear done
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Todo Row ─────────────────────────────────────────────────────────────────

function TodoRow({
  todo,
  isLast,
  onToggle,
  onDelete,
}: {
  todo: Todo;
  isLast: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={`flex items-center gap-4 px-5 py-3.5 group hover:bg-stone-50 dark:hover:bg-zinc-800/50 transition-colors ${
        !isLast ? "border-b border-zinc-100 dark:border-zinc-800" : ""
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
          todo.done
            ? "bg-violet-500 border-violet-500"
            : "border-zinc-300 dark:border-zinc-600 hover:border-violet-400"
        }`}
      >
        {todo.done && (
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path
              d="M1.5 4.5L3.5 6.5L7.5 2.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      {/* Text */}
      <span
        className={`flex-1 text-sm leading-relaxed transition-colors ${
          todo.done
            ? "line-through text-zinc-400 dark:text-zinc-500"
            : "text-zinc-800 dark:text-zinc-100"
        }`}
      >
        {todo.text}
      </span>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/20 text-zinc-300 hover:text-red-400 transition-all"
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
    </li>
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
