import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import ThemeController from "@/components/ThemeController";
import { THEME_COOKIE, parseThemePreference, resolveDark, sunLocationForTimeZone } from "@/lib/theme";

export const metadata: Metadata = {
  title: "DueNext",
  description: "Track expiration and due dates with scheduled reminders.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Resolve the theme here so the first paint is already right (no light
  // flash before switching to dark); ThemeController takes over from there.
  const preference = parseThemePreference((await cookies()).get(THEME_COOKIE)?.value);
  const location = sunLocationForTimeZone(process.env.REMINDER_TIMEZONE || "Asia/Tokyo");
  const dark = resolveDark(preference, new Date(), location);

  return (
    <html
      lang="en"
      className={`h-full antialiased ${dark ? "dark" : ""}`}
      data-theme={preference}
      data-sun-lat={location.latitude}
      data-sun-lng={location.longitude}
      // Auto mode may flip the class between the server render and hydration.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <ThemeController />
        {children}
      </body>
    </html>
  );
}
