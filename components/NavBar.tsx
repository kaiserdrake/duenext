"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import type { CurrentUser } from "@/lib/auth-utils";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/items/new", label: "New item" },
  { href: "/archive", label: "Archive" },
  { href: "/profile", label: "Profile" },
];

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
}: {
  user: CurrentUser;
  // Rendered by the parent Server Component and passed down, rather than
  // imported here directly - SignOutButton calls the server-only `signOut`
  // (which pulls in Prisma/pg), and importing a Server Component into a
  // "use client" module bundles it (and its server-only deps) for the
  // browser, breaking the build.
  signOutButton: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const links =
    user.role === "ADMIN" ? [...NAV_LINKS, { href: "/admin/users", label: "Settings" }] : NAV_LINKS;

  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-medium">
            DueNext
          </Link>
          <nav className="hidden items-center gap-4 text-sm text-slate-600 dark:text-slate-400 sm:flex">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-slate-900 dark:hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          <span className="text-sm text-slate-500 dark:text-slate-400">{user.name}</span>
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
      {open && (
        <nav className="flex flex-col gap-1 border-t border-slate-200 px-4 py-3 text-sm sm:hidden dark:border-slate-800">
          {links.map((link) => (
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
            <span className="text-sm text-slate-500 dark:text-slate-400">{user.name}</span>
            {signOutButton}
          </div>
        </nav>
      )}
    </header>
  );
}
