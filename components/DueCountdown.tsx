"use client";

import { useSyncExternalStore } from "react";

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/*
 * One shared 1s clock for every countdown on the page, rather than an
 * interval per card. The server snapshot is null so the markup hydrates
 * without a time mismatch; the ring then sweeps in on the first client tick.
 */
let now = Date.now();
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, SECOND);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null
  );
}

function shortLabel(ms: number): string {
  if (ms <= 0) return "now";
  if (ms >= DAY) return `${Math.floor(ms / DAY)}d`;
  if (ms >= HOUR) return `${Math.floor(ms / HOUR)}h`;
  if (ms >= MINUTE) return `${Math.floor(ms / MINUTE)}m`;
  return `${Math.ceil(ms / SECOND)}s`;
}

function longLabel(ms: number): string {
  if (ms <= 0) return "Due now";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MINUTE);
  const parts = [d && `${d}d`, (d || h) && `${h}h`, `${m}m`].filter(Boolean);
  return `${parts.join(" ")} left`;
}

function toneFor(ms: number): { stroke: string; text: string } {
  if (ms < 2 * DAY) return { stroke: "stroke-rose-500", text: "text-rose-600 dark:text-rose-400" };
  if (ms < 3 * DAY) return { stroke: "stroke-amber-500", text: "text-amber-600 dark:text-amber-400" };
  return { stroke: "stroke-sky-500", text: "text-sky-600 dark:text-sky-400" };
}

const SIZE = 40;
const STROKE = 3.5;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * A draining progress ring: full at `windowMs` out (and anything further),
 * empty at the due instant. Turns amber inside three days, rose inside two,
 * and softly pulses in the final hour.
 */
export default function DueCountdown({ dueAt, windowMs }: { dueAt: string; windowMs: number }) {
  const current = useNow();
  const remaining = current === null ? null : Date.parse(dueAt) - current;
  const fraction = remaining === null ? 0 : Math.min(1, Math.max(0, remaining / windowMs));
  const tone = toneFor(remaining ?? windowMs);
  const urgent = remaining !== null && remaining < HOUR;

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      title={remaining === null ? undefined : longLabel(remaining)}
      aria-label={remaining === null ? undefined : longLabel(remaining)}
      role="img"
    >
      {urgent && (
        <span className="absolute inset-0 rounded-full bg-rose-500/15 motion-safe:animate-ping [animation-duration:2s]" />
      )}
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
          className={`${tone.stroke} transition-[stroke-dashoffset] duration-1000 ease-out`}
        />
      </svg>
      <span className={`relative text-[10px] font-semibold tabular-nums ${tone.text}`}>
        {remaining === null ? "" : shortLabel(remaining)}
      </span>
    </div>
  );
}
