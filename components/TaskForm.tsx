"use client";

import { useState } from "react";
import { TASK_TYPE_HINTS, TASK_TYPE_LABELS, type TaskType } from "@/lib/taskTimer";
import { PAPER_CLASSES } from "@/components/TaskCard";
import DateInput from "@/components/DateInput";
import { ACTION_ITEM_CATEGORY } from "@/lib/constants";

const TYPES: TaskType[] = ["SHORT", "LONG", "FREE"];

export interface TaskFormValues {
  title: string;
  notes: string;
  type: TaskType;
  /** "YYYY-MM-DD" or "" for no deadline. */
  dueDate: string;
  dueTime: string;
}

/** Add/edit form for a task card, styled as a blank post-it of the chosen type. */
export default function TaskForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: TaskFormValues;
  submitLabel: string;
  onSubmit: (values: TaskFormValues) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [type, setType] = useState<TaskType>(initial?.type ?? "SHORT");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(initial?.dueTime ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Enter a title");
      return;
    }
    if (dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      setError("Enter the deadline as YYYY-MM-DD");
      return;
    }
    setSubmitting(true);
    const message = await onSubmit({
      title: title.trim(),
      notes: notes.trim(),
      type,
      dueDate,
      dueTime: dueDate ? dueTime : "",
    });
    setSubmitting(false);
    if (message) setError(message);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
      }}
      className={`flex flex-col gap-2 rounded-[3px] p-3 shadow-[0_1px_2px_rgba(15,23,42,0.12),0_3px_6px_-2px_rgba(15,23,42,0.12)] transition-colors ${PAPER_CLASSES[type]}`}
    >
      <input
        type="text"
        autoFocus
        value={title}
        onChange={(e) => {
          setTitle(e.target.value);
          setError(null);
        }}
        placeholder="What are you working on?"
        maxLength={200}
        className="h-8 w-full rounded border border-black/10 bg-white/60 px-2 text-sm outline-none placeholder:text-black/40 focus:border-black/30"
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
        rows={2}
        maxLength={2000}
        className="w-full resize-none rounded border border-black/10 bg-white/60 px-2 py-1 text-xs outline-none placeholder:text-black/40 focus:border-black/30"
      />
      <div className="flex gap-1" role="radiogroup" aria-label="Type">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => setType(t)}
            title={TASK_TYPE_HINTS[t]}
            className={`flex-1 rounded border px-1.5 py-1 text-left text-[11px] leading-tight ${PAPER_CLASSES[t]} ${
              type === t ? "border-black/50 ring-1 ring-black/30" : "border-black/10 opacity-70 hover:opacity-100"
            }`}
          >
            <span className="block font-medium">{TASK_TYPE_LABELS[t]}</span>
            <span className="block opacity-70">{TASK_TYPE_HINTS[t]}</span>
          </button>
        ))}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <div className="min-w-0 flex-1">
            <DateInput
              value={dueDate}
              onChange={setDueDate}
              className="h-8 w-full rounded border border-black/10 bg-white/60 px-2 text-xs outline-none focus:border-black/30"
            />
          </div>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            disabled={!dueDate}
            aria-label="Deadline time (optional)"
            className="h-8 w-24 shrink-0 rounded border border-black/10 bg-white/60 px-1.5 text-xs outline-none focus:border-black/30 disabled:opacity-40"
          />
          {dueDate && (
            <button
              type="button"
              onClick={() => {
                setDueDate("");
                setDueTime("");
              }}
              className="shrink-0 rounded px-1.5 text-xs opacity-60 hover:bg-black/5 hover:opacity-100"
              aria-label="Clear deadline"
              title="Clear deadline"
            >
              ✕
            </button>
          )}
        </div>
        <p className="mt-1 text-[11px] opacity-60">
          Deadline (optional): shows in Appointments as an {ACTION_ITEM_CATEGORY}.
        </p>
      </div>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-2.5 py-1 text-xs opacity-70 hover:bg-black/5 hover:opacity-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-slate-900 px-2.5 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
