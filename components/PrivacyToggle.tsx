"use client";

import { useRouter } from "next/navigation";
import { PRIVACY_COOKIE } from "@/lib/privacy";

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
      {off && <path d="M3 3l18 18" />}
    </svg>
  );
}

/** Switches the dashboard's privacy mode on or off for this browser. */
export default function PrivacyToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();

  function toggle() {
    const maxAge = enabled ? 0 : 60 * 60 * 24 * 365;
    document.cookie = `${PRIVACY_COOKIE}=1; path=/; max-age=${maxAge}; SameSite=Lax`;
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      title={enabled ? "Privacy mode is on: appointment details are blurred. Click to show them." : "Blur appointment details (privacy mode)"}
      className={`flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm ${
        enabled
          ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-700 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
          : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
      }`}
    >
      <EyeIcon off={enabled} />
      <span className="hidden sm:inline">{enabled ? "Private" : "Privacy"}</span>
    </button>
  );
}
