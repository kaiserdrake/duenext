"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/auth-utils";
import ThemeSwitch from "@/components/ThemeSwitch";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/items/new", label: "New item" },
  { href: "/archive", label: "Archive" },
];

function GearIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {open ? (
        <path d="M18 6 6 18M6 6l12 12" />
      ) : (
        <path d="M3 6h18M3 12h18M3 18h18" />
      )}
    </svg>
  );
}

export default function NavBar({
  user,
  signOutButton,
  wideDashboard = false,
  themeInitial,
}: {
  user: CurrentUser;
  /**
   * The dashboard runs wider when it has the task board beside it (see
   * AppMain). The header uses that width on every page, so it doesn't shift
   * when you move between pages.
   */
  wideDashboard?: boolean;
  /** This browser's saved theme preference (cookie), for the theme switch. */
  themeInitial?: string;
  // Rendered by the parent Server Component and passed down, rather than
  // imported here directly - SignOutButton calls the server-only `signOut`
  // (which pulls in Prisma/pg), and importing a Server Component into a
  // "use client" module bundles it (and its server-only deps) for the
  // browser, breaking the build.
  signOutButton: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className={`mx-auto flex h-14 max-w-4xl items-center justify-between px-4 ${wideDashboard ? "lg:max-w-7xl" : ""}`}>
        <div className="flex items-center gap-6">
          <Link href="/" className="font-medium">
            DueNext
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-600 dark:text-slate-400 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900 dark:hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeSwitch initial={themeInitial} />
          <div className="hidden items-center gap-4 sm:flex">
            <Link
              href="/settings"
              title="Settings"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {user.name}
              <GearIcon />
            </Link>
            {signOutButton}
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:hidden"
          >
            <MenuIcon open={open} />
          </button>
        </div>
      </div>
      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-sm sm:hidden dark:border-slate-800">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-2 py-2 text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {link.label}
            </Link>
          ))}
          <div className="mt-2 flex items-center justify-between border-t border-slate-200 px-2 pt-3 dark:border-slate-800">
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
              {user.name}
              <GearIcon />
            </Link>
            {signOutButton}
          </div>
        </nav>
      )}
    </header>
  );
}
