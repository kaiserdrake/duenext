"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { TASK_TYPE_LABELS, formatWorked, type TaskDTO, type TaskType } from "@/lib/taskTimer";

const HOLD_MS = 2000;
const RING_RADIUS = 10;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

/** Post-it paper colour per task type. */
export const PAPER_CLASSES: Record<TaskType, string> = {
  SHORT: "bg-amber-100 text-amber-950 dark:bg-amber-200/90 dark:text-amber-950",
  LONG: "bg-sky-100 text-sky-950 dark:bg-sky-200/90 dark:text-sky-950",
  FREE: "bg-lime-100 text-lime-950 dark:bg-lime-200/90 dark:text-lime-950",
};

const BADGE_CLASSES: Record<TaskType, string> = {
  SHORT: "bg-amber-200/70 text-amber-900",
  LONG: "bg-sky-200/70 text-sky-900",
  FREE: "bg-lime-200/70 text-lime-900",
};

/** A small resting tilt (±1.2°) that's stable per card, so it doesn't jump on re-render. */
export function restingTilt(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return ((Math.abs(hash) % 25) - 12) / 10;
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  );
}

// Deletes only after being held for HOLD_MS, with a filling ring as
// feedback - releasing early (or the pointer leaving the button) cancels it,
// so an accidental tap or drag-through can't delete a card.
export function DeleteHoldButton({ onConfirm }: { onConfirm: () => void }) {
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
      className="relative flex h-6 w-6 shrink-0 touch-none items-center justify-center rounded opacity-60 select-none hover:text-red-700 hover:opacity-100"
    >
      <TrashIcon />
      {holding && (
        <svg width="24" height="24" viewBox="0 0 24 24" className="pointer-events-none absolute -rotate-90 text-red-600">
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

/** A small icon button on a card; text colour comes from the paper. */
export function CardButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded opacity-60 hover:bg-black/5 hover:opacity-100"
    >
      {children}
    </button>
  );
}

export function PlayIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 20h4L19 9l-4-4L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </svg>
  );
}

export function UndoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/** "Nov 2" / "Nov 2 10:30" from a task's deadline fields. */
function deadlineLabel(dueDate: string, dueTime: string | null): string {
  const [y, m, d] = dueDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return dueTime ? `${date} ${dueTime}` : date;
}

/**
 * A task as a post-it note. Purely presentational - drag behaviour comes
 * from the wrapper (see TaskBoard), and `actions` are the card's buttons.
 */
export default function TaskCard({
  task,
  actions,
  lifted = false,
  ghost = false,
  compact = false,
}: {
  task: TaskDTO;
  actions?: ReactNode;
  /** Being carried (rendered in the drag overlay): bigger tilt and shadow. */
  lifted?: boolean;
  /** The spot a carried card came from. */
  ghost?: boolean;
  compact?: boolean;
}) {
  const tilt = lifted ? 3 : restingTilt(task.id);
  const meta = [
    task.rounds > 0 && `${task.rounds} round${task.rounds === 1 ? "" : "s"}`,
    task.workedSeconds >= 60 && formatWorked(task.workedSeconds),
  ].filter(Boolean);

  return (
    <div
      style={{ transform: `rotate(${tilt}deg) scale(${lifted ? 1.04 : 1})` }}
      className={`relative rounded-[3px] px-3 pt-3 pb-2 transition-[transform,box-shadow,opacity] duration-150 ${PAPER_CLASSES[task.type]} ${
        lifted
          ? "cursor-grabbing shadow-[0_18px_30px_-8px_rgba(15,23,42,0.35),0_4px_8px_rgba(15,23,42,0.12)]"
          : "shadow-[0_1px_2px_rgba(15,23,42,0.12),0_3px_6px_-2px_rgba(15,23,42,0.12)]"
      } ${ghost ? "opacity-30" : ""}`}
    >
      {/* A strip of tape holding the note to the board. */}
      <span
        aria-hidden="true"
        className="absolute -top-1.5 left-1/2 h-3 w-10 -translate-x-1/2 -rotate-2 bg-white/60 shadow-[0_0_0_0.5px_rgba(15,23,42,0.08)] dark:bg-white/40"
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {/* data-sensitive: private cards blur while privacy mode is on. */}
          <div
            className={`flex items-start gap-1 font-medium break-words ${compact ? "text-xs" : "text-sm"}`}
          >
            {task.isPrivate && (
              <span className="mt-0.5 shrink-0 opacity-50" title="Private: blurred in privacy mode">
                <LockIcon />
              </span>
            )}
            <span className="min-w-0" data-sensitive={task.isPrivate || undefined}>
              {task.title}
            </span>
          </div>
          {task.notes && !compact && (
            <div
              className="mt-0.5 line-clamp-2 text-xs whitespace-pre-line opacity-70"
              data-sensitive={task.isPrivate || undefined}
            >
              {task.notes}
            </div>
          )}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-[11px]">
          <span className={`rounded px-1.5 py-px font-medium ${BADGE_CLASSES[task.type]}`}>
            {TASK_TYPE_LABELS[task.type]}
          </span>
          {task.dueDate && (
            <span
              className="flex shrink-0 items-center gap-1 rounded bg-white/50 px-1.5 py-px font-medium"
              title="Deadline (also listed in Appointments as an Action Item)"
            >
              <CalendarIcon />
              {deadlineLabel(task.dueDate, task.dueTime)}
            </span>
          )}
          {meta.length > 0 && <span className="truncate opacity-70">{meta.join(" · ")}</span>}
        </div>
        {actions && (
          // Keep presses on the buttons from picking the card up.
          <div
            className="-mr-1 flex items-center"
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
