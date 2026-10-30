"use client";

import { useEffect } from "react";
import { THEME_COOKIE, parseThemePreference, resolveDark, type ThemePreference } from "@/lib/theme";

// The root layout renders <html> with the `dark` class already resolved and
// the preference + sun location in data attributes; everything here works
// off those, so the switch in the header and this ticker stay in agreement.

function readHtmlState() {
  const html = document.documentElement;
  return {
    preference: parseThemePreference(html.dataset.theme),
    location: { latitude: Number(html.dataset.sunLat), longitude: Number(html.dataset.sunLng) },
  };
}

function applyDark() {
  const { preference, location } = readHtmlState();
  document.documentElement.classList.toggle("dark", resolveDark(preference, new Date(), location));
}

/** Saves the preference for this browser and applies it straight away. */
export function setThemePreference(preference: ThemePreference) {
  document.cookie = `${THEME_COOKIE}=${preference}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  document.documentElement.dataset.theme = preference;
  applyDark();
}

/** In auto mode, flips between light and dark at sunrise and sunset without a reload. */
export default function ThemeController() {
  useEffect(() => {
    applyDark();
    const interval = setInterval(applyDark, 60_000);
    return () => clearInterval(interval);
  }, []);
  return null;
}
