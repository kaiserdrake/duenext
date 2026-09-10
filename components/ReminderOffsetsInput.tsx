"use client";

import { useState } from "react";
import { offsetLabel } from "@/lib/reminderOffsets";
import { REMINDER_OFFSET_STEP_MINUTES } from "@/lib/constants";

type Unit = "days" | "hours" | "minutes";

const UNIT_MINUTES: Record<Unit, number> = {
  days: 1440,
  hours: 60,
  minutes: 1,
};

export default function ReminderOffsetsInput({
  value,
  onChange,
}: {
  value: number[];
  onChange: (next: number[]) => void;
}) {
  const [amount, setAmount] = useState("");
  const [unit, setUnit] = useState<Unit>("days");

  function addOffset() {
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) return;

    let minutes = parsed * UNIT_MINUTES[unit];
    // The scheduler only checks every 5 minutes, so anything finer isn't
    // meaningful - round to the nearest step rather than reject it.
    minutes = Math.round(minutes / REMINDER_OFFSET_STEP_MINUTES) * REMINDER_OFFSET_STEP_MINUTES;

    if (value.includes(minutes)) {
      setAmount("");
      return;
    }
    onChange([...value, minutes].sort((a, b) => b - a));
    setAmount("");
  }

  return (
    <div>
      {value.length > 0 ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {value.map((minutes) => (
            <span
              key={minutes}
              className="flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {offsetLabel(minutes)}
              <button
                type="button"
                onClick={() => onChange(value.filter((m) => m !== minutes))}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-100"
                aria-label={`Remove ${offsetLabel(minutes)} reminder`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : (
        <p className="mb-2 text-xs text-slate-400">No reminders set for this item.</p>
      )}

      <div className="flex gap-2">
        <input
          type="number"
          step={unit === "minutes" ? REMINDER_OFFSET_STEP_MINUTES : 1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOffset();
            }
          }}
          placeholder="Amount"
          className="h-9 w-24 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
        />
        <select
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
          className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
        >
          <option value="days">Days</option>
          <option value="hours">Hours</option>
          <option value="minutes">Minutes</option>
        </select>
        <button
          type="button"
          onClick={addOffset}
          className="h-9 rounded-md border border-slate-300 px-4 text-sm hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          Add
        </button>
      </div>
      {unit === "minutes" && (
        <p className="mt-1 text-xs text-slate-400">
          Rounds to the nearest {REMINDER_OFFSET_STEP_MINUTES} minutes.
        </p>
      )}
    </div>
  );
}
