"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ItemCard from "@/components/ItemCard";
import type { ItemWithRelations } from "@/lib/items";

/** How long the hide button has to be held - long enough that a stray tap doesn't hide anything. */
const HOLD_MS = 800;

function EyeIcon({ off = false }: { off?: boolean }) {
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
    >
      {off ? (
        <>
          <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
          <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
          <path d="M6.61 6.61A13.53 13.53 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
          <path d="m2 2 20 20" />
        </>
      ) : (
        <>
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

async function setHidden(itemId: string, hidden: boolean): Promise<boolean> {
  const res = await fetch(`/api/items/${itemId}/hide`, { method: hidden ? "POST" : "DELETE" });
  return res.ok;
}

function HoldToHideButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [holding, setHolding] = useState(false);
  const [busy, setBusy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function start() {
    if (busy || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(async () => {
      timer.current = null;
      setHolding(false);
      setBusy(true);
      if (await setHidden(itemId, true)) router.refresh();
      setBusy(false);
    }, HOLD_MS);
  }

  function cancel() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  }

  return (
    <button
      type="button"
      disabled={busy}
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !e.repeat) {
          e.preventDefault();
          start();
        }
      }}
      onKeyUp={cancel}
      // Long-pressing on touch screens would otherwise pop the context menu.
      onContextMenu={(e) => e.preventDefault()}
      className="relative shrink-0 touch-manipulation select-none overflow-hidden rounded-md border border-red-200 p-2 text-red-700 disabled:opacity-50 dark:border-red-900 dark:text-red-300"
      title="Press and hold to hide this overdue item"
      aria-label="Hold to hide"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 bg-red-200 dark:bg-red-900"
        style={{
          width: holding ? "100%" : "0%",
          transition: holding ? `width ${HOLD_MS}ms linear` : "none",
        }}
      />
      <span className={`relative block ${busy ? "animate-pulse" : ""}`}>
        <EyeIcon off />
      </span>
    </button>
  );
}

function UnhideButton({ itemId }: { itemId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        if (await setHidden(itemId, false)) router.refresh();
        setBusy(false);
      }}
      className={`shrink-0 rounded-md border border-slate-200 p-2 text-slate-500 hover:text-slate-900 disabled:opacity-50 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-100 ${busy ? "animate-pulse" : ""}`}
      title="Unhide"
      aria-label="Unhide"
    >
      <EyeIcon />
    </button>
  );
}

export default function OverdueSection({
  visibleItems,
  hiddenItems,
  currentUserId,
}: {
  visibleItems: ItemWithRelations[];
  hiddenItems: ItemWithRelations[];
  currentUserId: string;
}) {
  const [showHidden, setShowHidden] = useState(false);

  if (visibleItems.length === 0 && hiddenItems.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-medium text-slate-500 dark:text-slate-400">Overdue</h2>
        {hiddenItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowHidden((v) => !v)}
            className="text-xs text-slate-400 underline hover:text-slate-700 dark:text-slate-500 dark:hover:text-slate-200"
          >
            {showHidden ? "Hide hidden" : `Show hidden (${hiddenItems.length})`}
          </button>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {visibleItems.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <div className="min-w-0 flex-1">
              <ItemCard item={item} currentUserId={currentUserId} />
            </div>
            <HoldToHideButton itemId={item.id} />
          </div>
        ))}
        {showHidden &&
          hiddenItems.map((item) => (
            <div key={item.id} className="flex items-center gap-2 opacity-60">
              <div className="min-w-0 flex-1">
                <ItemCard item={item} currentUserId={currentUserId} />
              </div>
              <UnhideButton itemId={item.id} />
            </div>
          ))}
      </div>
    </div>
  );
}
