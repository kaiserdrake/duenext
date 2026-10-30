"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/**
 * The page's main column. Normally max-w-4xl; the dashboard widens on large
 * screens when the task board sits beside the appointments.
 */
export default function AppMain({ wideDashboard, children }: { wideDashboard: boolean; children: ReactNode }) {
  const pathname = usePathname();
  const wide = wideDashboard && pathname === "/";
  return (
    <main className={`mx-auto w-full max-w-4xl flex-1 px-4 py-8 ${wide ? "lg:max-w-7xl" : ""}`}>{children}</main>
  );
}
