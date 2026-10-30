"use client";

import { useNow } from "@/components/DueCountdown";
import { formatClock, phaseDurationSeconds, phaseElapsedSeconds, type TaskDTO } from "@/lib/taskTimer";

export interface TaskClock {
  /** Null until the first client tick (keeps hydration free of time mismatches). */
  elapsed: number | null;
  /** Phase length; null for an open-ended (count-up) phase. */
  duration: number | null;
  /** The phase's time has run out. Stays true until the user moves on. */
  expired: boolean;
  /** What the clock face shows: time left, or time elapsed when counting up. */
  display: string;
}

/** Live view of a task's running phase, derived from `phaseStartedAt` on the shared 1s clock. */
export function useTaskClock(task: TaskDTO | null): TaskClock {
  const now = useNow();
  if (!task?.phase || now === null) {
    return { elapsed: null, duration: null, expired: false, display: "" };
  }
  const elapsed = phaseElapsedSeconds(task.phaseStartedAt, now);
  const duration = phaseDurationSeconds(task.type, task.phase);
  const expired = duration !== null && elapsed >= duration;
  return {
    elapsed,
    duration,
    expired,
    display: formatClock(duration === null ? elapsed : duration - elapsed),
  };
}

const SIZE = 96;
const STROKE = 6;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The Active slot's clock face: a ring that drains over a countdown (or
 * sweeps once a minute when counting up), with the time and phase inside.
 */
export default function TaskTimer({ task, clock }: { task: TaskDTO; clock: TaskClock }) {
  const { elapsed, duration, expired } = clock;
  const resting = task.phase === "REST";
  const fraction =
    elapsed === null
      ? 1
      : duration === null
        ? (elapsed % 60) / 60
        : Math.max(0, 1 - elapsed / duration);
  const stroke = expired ? "stroke-amber-500" : resting ? "stroke-teal-500" : "stroke-rose-500";
  const label = expired ? (resting ? "Break over" : "Time's up") : resting ? "Break" : duration === null ? "Counting up" : "Focus";

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      role="timer"
      aria-label={`${label} ${clock.display}`}
    >
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-slate-200 dark:stroke-slate-800"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          // No transition on the count-up's wrap from full back to empty.
          className={`${stroke} ${duration === null && fraction === 0 ? "" : "transition-[stroke-dashoffset] duration-1000 ease-linear"}`}
        />
      </svg>
      <div className="relative text-center leading-tight">
        <div className={`text-lg font-semibold tabular-nums ${expired ? "text-amber-600 dark:text-amber-400" : ""}`}>
          {clock.display || "--:--"}
        </div>
        <div className="text-[10px] tracking-wide text-slate-500 uppercase dark:text-slate-400">{label}</div>
      </div>
    </div>
  );
}
