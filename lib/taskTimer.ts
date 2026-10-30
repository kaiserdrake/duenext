// Task board timing rules, shared by the API (lib/tasks.ts) and the board's
// client components - so keep this free of Prisma/server-only imports.

export type TaskType = "SHORT" | "LONG" | "FREE";
export type TaskStatus = "QUEUED" | "ACTIVE" | "DONE";
export type TaskPhase = "WORK" | "REST";

/** A task as sent to the browser (dates as ISO strings). */
export interface TaskDTO {
  id: string;
  title: string;
  notes: string | null;
  type: TaskType;
  status: TaskStatus;
  sortOrder: number;
  phase: TaskPhase | null;
  phaseStartedAt: string | null;
  workedSeconds: number;
  rounds: number;
  completedAt: string | null;
  /** Optional deadline, "YYYY-MM-DD" (+ optional "HH:mm"). */
  dueDate: string | null;
  dueTime: string | null;
  /** Blurred while the dashboard's privacy mode is on. */
  isPrivate: boolean;
}

const MINUTE = 60;

/** Work phase length in seconds; null means a count-up timer with no end. */
export const WORK_SECONDS: Record<TaskType, number | null> = {
  SHORT: 25 * MINUTE,
  LONG: 55 * MINUTE,
  FREE: null,
};

export const REST_SECONDS = 5 * MINUTE;

/** Done cards are cleared out this long after completion. */
export const DONE_RETENTION_DAYS = 7;

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  SHORT: "Short",
  LONG: "Long",
  FREE: "Free",
};

export const TASK_TYPE_HINTS: Record<TaskType, string> = {
  SHORT: "25m work · 5m rest",
  LONG: "55m work · 5m rest",
  FREE: "Count up · 5m rest",
};

/** Seconds since the current phase started (0 when no phase is running). */
export function phaseElapsedSeconds(
  phaseStartedAt: Date | string | null,
  now: number
): number {
  if (!phaseStartedAt) return 0;
  const start = typeof phaseStartedAt === "string" ? Date.parse(phaseStartedAt) : phaseStartedAt.getTime();
  return Math.max(0, Math.floor((now - start) / 1000));
}

/** Length of the running phase, or null for an open-ended (count-up) one. */
export function phaseDurationSeconds(type: TaskType, phase: TaskPhase | null): number | null {
  if (phase === "REST") return REST_SECONDS;
  if (phase === "WORK") return WORK_SECONDS[type];
  return null;
}

/**
 * Work seconds to bank when the running work phase ends. Capped at the
 * phase length for timed types - a timer left ringing in another tab isn't
 * extra work done.
 */
export function bankableWorkSeconds(
  task: { type: TaskType; phase: TaskPhase | null; phaseStartedAt: Date | string | null },
  now: number
): number {
  if (task.phase !== "WORK") return 0;
  const elapsed = phaseElapsedSeconds(task.phaseStartedAt, now);
  const limit = WORK_SECONDS[task.type];
  return limit === null ? elapsed : Math.min(elapsed, limit);
}

/** "MM:SS", or "H:MM:SS" once past an hour. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Compact total like "1h 20m" / "35m" for worked time on a card. */
export function formatWorked(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  if (m < 60) return `${m}m`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
