"use client";

import { useState } from "react";
import { parseThemePreference, type ThemePreference } from "@/lib/theme";
import { setThemePreference } from "@/components/ThemeController";

const NEXT: Record<ThemePreference, ThemePreference> = { light: "dark", dark: "auto", auto: "light" };

const LABELS: Record<ThemePreference, string> = {
  light: "Theme: light",
  dark: "Theme: dark",
  auto: "Theme: auto (dark from sunset to sunrise)",
};

function Icon({ preference }: { preference: ThemePreference }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {preference === "light" && (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </>
      )}
      {preference === "dark" && <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      {preference === "auto" && (
        <>
          {/* Half sun, half moon over a horizon line. */}
          <path d="M3 18h18" />
          <path d="M12 6a6 6 0 0 0-6 6v2h6z" />
          <path d="M12 6a6 6 0 0 1 6 6v2h-6" />
          <path d="M12 2v1.5M4.2 6.2l1 1M19.8 6.2l-1 1" />
        </>
      )}
    </svg>
  );
}

/** Header button cycling light → dark → auto for this browser. */
export default function ThemeSwitch({ initial }: { initial: string | undefined }) {
  const [preference, setPreference] = useState(() => parseThemePreference(initial));

  function cycle() {
    const next = NEXT[preference];
    setPreference(next);
    setThemePreference(next);
  }

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={`${LABELS[preference]}. Click to change.`}
      title={`${LABELS[preference]} - click to change`}
      className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      <Icon preference={preference} />
    </button>
  );
}
