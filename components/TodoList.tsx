"use client";

import { useEffect, useRef, useState } from "react";

interface Todo {
  id: string;
  title: string;
  notes: string | null;
  done: boolean;
  sortOrder: number;
}

const HOLD_MS = 2000;
const RING_RADIUS = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

function NoteIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6" />
      <path d="M8 13h8M8 17h5" />
    </svg>
  );
}

// Deletes only after being held for HOLD_MS, with a filling ring as
// feedback - releasing early (or the pointer leaving the button) cancels it,
// so an accidental tap or drag-through can't delete a to-do.
function DeleteHoldButton({ onConfirm }: { onConfirm: () => void }) {
  const [holding, setHolding] = useState(false);
  const [filled, setFilled] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function start() {
    setHolding(true);
    // Paint the empty ring first, then flip `filled` on the next frame so
    // the stroke-dashoffset transition actually animates instead of
    // snapping straight to full.
    rafRef.current = requestAnimationFrame(() => setFilled(true));
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setHolding(false);
      setFilled(false);
      onConfirm();
    }, HOLD_MS);
  }

  function cancel() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setHolding(false);
    setFilled(false);
  }

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Hold for 2 seconds to delete"
      title="Hold for 2 seconds to delete"
      className="relative flex h-6 w-6 shrink-0 touch-none items-center justify-center text-slate-400 select-none hover:text-red-600 dark:text-slate-500 dark:hover:text-red-400"
    >
      <TrashIcon />
      {holding && (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          className="pointer-events-none absolute -rotate-90 text-red-500"
        >
          <circle
            cx="12"
            cy="12"
            r={RING_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray={RING_CIRCUMFERENCE}
            strokeDashoffset={filled ? 0 : RING_CIRCUMFERENCE}
            style={{ transition: filled ? `stroke-dashoffset ${HOLD_MS}ms linear` : "none" }}
          />
        </svg>
      )}
    </button>
  );
}

function sorted(list: Todo[]) {
  return [...list].sort((a, b) => {
    if (a.done !== b.done) return Number(a.done) - Number(b.done);
    return a.sortOrder - b.sortOrder;
  });
}

async function patchTodo(id: string, data: Record<string, unknown>) {
  return fetch(`/api/todos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export default function TodoList({ initialTodos }: { initialTodos: Todo[] }) {
  const [todos, setTodos] = useState<Todo[]>(sorted(initialTodos));
  const [title, setTitle] = useState("");
  const [openNotes, setOpenNotes] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        return;
      }
      const { todo } = await res.json();
      setTodos((prev) => sorted([...prev, todo]));
      setTitle("");
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(id: string, done: boolean) {
    setTodos((prev) => sorted(prev.map((t) => (t.id === id ? { ...t, done } : t))));
    const res = await patchTodo(id, { done });
    if (!res.ok) {
      setTodos((prev) => sorted(prev.map((t) => (t.id === id ? { ...t, done: !done } : t))));
      setError("Couldn't update this to-do");
    }
  }

  async function handleDelete(id: string) {
    const previous = todos;
    setTodos((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/todos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setTodos(previous);
      setError("Couldn't delete this to-do");
    }
  }

  function toggleNotes(id: string) {
    setOpenNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleNotesChange(id: string, notes: string) {
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, notes } : t)));
  }

  async function handleNotesBlur(id: string, notes: string) {
    const res = await patchTodo(id, { notes: notes.trim() || null });
    if (!res.ok) setError("Couldn't save note");
  }

  async function handleMove(index: number, direction: "up" | "down") {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    const a = todos[index];
    const b = todos[swapIndex];
    if (!a || !b || a.done !== b.done) return;

    const reordered = [...todos];
    reordered[index] = b;
    reordered[swapIndex] = a;

    // Renumber every row to its new position rather than just swapping the
    // two rows' stored sortOrder values - rows created before sortOrder
    // existed can share the same backfilled value, so a raw swap between
    // two equal values wouldn't actually change anything. Renumbering here
    // self-heals that the first time a row is moved.
    const previous = todos;
    const next = reordered.map((t, i) => ({ ...t, sortOrder: i }));
    setTodos(next);

    const changed = next.filter(
      (t, i) => previous[i]?.id !== t.id || previous[i]?.sortOrder !== t.sortOrder
    );
    const results = await Promise.all(changed.map((t) => patchTodo(t.id, { sortOrder: t.sortOrder })));
    if (results.some((res) => !res.ok)) {
      setTodos(previous);
      setError("Couldn't reorder to-dos");
    }
  }

  return (
    <div>
      {error && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <form onSubmit={handleAdd} className="mb-6 flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a to-do"
          className="h-9 w-full flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
        />
        <button
          type="submit"
          disabled={submitting || !title.trim()}
          className="h-9 shrink-0 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          Add
        </button>
      </form>

      {todos.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No to-dos yet. Add one above.
        </div>
      ) : (
        <div className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
          {todos.map((todo, index) => {
            const canMoveUp = index > 0 && todos[index - 1].done === todo.done;
            const canMoveDown = index < todos.length - 1 && todos[index + 1].done === todo.done;
            const noteOpen = openNotes.has(todo.id);

            return (
              <div key={todo.id} className="px-4 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={todo.done}
                      onChange={(e) => handleToggle(todo.id, e.target.checked)}
                      className="h-auto w-auto shrink-0"
                    />
                    <span
                      onClick={() => toggleNotes(todo.id)}
                      className={`cursor-pointer truncate text-sm ${
                        todo.done ? "text-slate-400 line-through dark:text-slate-500" : ""
                      }`}
                    >
                      {todo.title}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => handleMove(index, "up")}
                        disabled={!canMoveUp}
                        aria-label="Move up"
                        title="Move up"
                        className="leading-none text-slate-400 hover:text-slate-900 disabled:opacity-25 disabled:hover:text-slate-400 dark:text-slate-500 dark:hover:text-slate-100"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMove(index, "down")}
                        disabled={!canMoveDown}
                        aria-label="Move down"
                        title="Move down"
                        className="leading-none text-slate-400 hover:text-slate-900 disabled:opacity-25 disabled:hover:text-slate-400 dark:text-slate-500 dark:hover:text-slate-100"
                      >
                        ▼
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotes(todo.id)}
                      aria-label={noteOpen ? "Hide note" : todo.notes ? "Edit note" : "Add note"}
                      title={noteOpen ? "Hide note" : todo.notes ? "Edit note" : "Add note"}
                      className={`shrink-0 hover:text-slate-900 dark:hover:text-slate-100 ${
                        noteOpen || todo.notes
                          ? "text-slate-600 dark:text-slate-300"
                          : "text-slate-400 dark:text-slate-500"
                      }`}
                    >
                      <NoteIcon />
                    </button>
                    <DeleteHoldButton onConfirm={() => handleDelete(todo.id)} />
                  </div>
                </div>

                {noteOpen && (
                  <textarea
                    autoFocus
                    rows={2}
                    value={todo.notes ?? ""}
                    onChange={(e) => handleNotesChange(todo.id, e.target.value)}
                    onBlur={(e) => handleNotesBlur(todo.id, e.target.value)}
                    placeholder="Notes / remarks"
                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
