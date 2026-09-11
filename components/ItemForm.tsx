"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ReminderOffsetsInput from "@/components/ReminderOffsetsInput";
import UserPicker from "@/components/UserPicker";
import CategorySelect from "@/components/CategorySelect";
import DateInput from "@/components/DateInput";
import { DEFAULT_REMINDER_OFFSETS_MINUTES, RECURRENCE_OPTIONS } from "@/lib/constants";

type Visibility = "PRIVATE" | "SHARED" | "CUSTOM";
type Recurrence = "MONTHLY" | "YEARLY" | "";

export interface ItemFormValues {
  id?: string;
  title: string;
  category: string;
  dueDate: string;
  dueTime: string;
  notes: string;
  visibility: Visibility;
  recurrence: Recurrence;
  reminderOffsetsMinutes: number[];
  userIds: string[];
  completedAt: string | null;
}

const labelClass = "mb-1 block text-sm text-slate-600 dark:text-slate-400";
// No width here on purpose: Tailwind's cascade order isn't the same as
// class-string order, so appending a different `w-*` after this doesn't
// reliably override a `w-full` baked into the shared class. Each usage
// adds its own width instead.
const controlClass =
  "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950";
const inputClass = `${controlClass} w-full`;
const dividerClass = "border-t border-slate-200 dark:border-slate-800";

export default function ItemForm({
  currentUserId,
  initial,
}: {
  currentUserId: string;
  initial?: ItemFormValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(initial?.dueTime ?? "");
  const [recurrence, setRecurrence] = useState<Recurrence>(initial?.recurrence ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [visibility, setVisibility] = useState<Visibility>(initial?.visibility ?? "PRIVATE");
  const [reminderOffsetsMinutes, setReminderOffsetsMinutes] = useState<number[]>(
    initial?.reminderOffsetsMinutes ?? DEFAULT_REMINDER_OFFSETS_MINUTES
  );
  const [userIds, setUserIds] = useState<string[]>(initial?.userIds ?? []);
  const [completed, setCompleted] = useState(Boolean(initial?.completedAt));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      title,
      category: category || null,
      dueDate,
      dueTime: dueTime || null,
      notes: notes || null,
      visibility,
      recurrence: recurrence || null,
      reminderOffsetsMinutes,
      userIds: visibility === "CUSTOM" ? userIds : [],
      ...(isEdit ? { completedAt: completed ? new Date().toISOString() : null } : {}),
    };

    try {
      const res = await fetch(isEdit ? `/api/items/${initial!.id}` : "/api/items", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Something went wrong");
        setSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong");
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm("Delete this item? This can't be undone.")) return;
    setSubmitting(true);
    const res = await fetch(`/api/items/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Couldn't delete this item");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <label className={labelClass}>Title</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Passport expiry"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Category</label>
        <CategorySelect
          value={category}
          onChange={setCategory}
          placeholder="Document"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Due date</label>
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <DateInput value={dueDate} onChange={setDueDate} required className={controlClass} />
          </div>
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            aria-label="Due time (optional)"
            title="Time (optional)"
            className={`${controlClass} w-36 shrink-0`}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Repeats</label>
        <select
          value={recurrence}
          onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          className={`${inputClass} sm:w-48`}
        >
          <option value="">Does not repeat</option>
          {RECURRENCE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {recurrence && (
          <p className="mt-1 text-xs text-slate-400">
            Once overdue, the due date jumps to the next {recurrence === "YEARLY" ? "year" : "month"}{" "}
            automatically.
          </p>
        )}
      </div>

      <div>
        <label className={labelClass}>Visibility</label>
        <div className="flex gap-2">
          {(
            [
              ["PRIVATE", "Only me"],
              ["SHARED", "All users"],
              ["CUSTOM", "Specific users"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => setVisibility(v)}
              className={`h-9 flex-1 rounded-md border text-sm ${
                visibility === v
                  ? "border-slate-900 text-slate-900 dark:border-slate-100 dark:text-slate-100"
                  : "border-slate-300 text-slate-600 dark:border-slate-700 dark:text-slate-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {visibility === "CUSTOM" && (
        <div>
          <label className={labelClass}>Share with</label>
          <UserPicker value={userIds} onChange={setUserIds} excludeUserId={currentUserId} />
        </div>
      )}

      <hr className={dividerClass} />

      <div>
        <label className={labelClass}>Remind me before</label>
        <ReminderOffsetsInput value={reminderOffsetsMinutes} onChange={setReminderOffsetsMinutes} />
      </div>

      <hr className={dividerClass} />

      <div>
        <label className={labelClass}>Notes</label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional details"
          className={`${inputClass} h-auto py-2`}
        />
      </div>

      {isEdit && (
        <div>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="h-auto w-auto"
            />
            Mark as done
          </label>
          {completed && (
            <p className="mt-1 text-xs text-slate-400">
              This item is archived. Uncheck and set a new due date to make it active
              again - reminders will start fresh for the new date.
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between">
        {isEdit ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
          >
            Delete item
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="h-9 rounded-md border border-slate-300 px-4 text-sm dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Save item
          </button>
        </div>
      </div>
    </form>
  );
}
