"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Sub-section tabs under Settings. Users is admin-only. */
export default function SettingsNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const sections = [
    { href: "/settings/profile", label: "Profile" },
    ...(isAdmin ? [{ href: "/settings/users", label: "Users" }] : []),
  ];

  return (
    <nav className="mb-6 flex gap-4 border-b border-slate-200 text-sm dark:border-slate-800">
      {sections.map((section) => {
        const current = pathname === section.href || pathname.startsWith(`${section.href}/`);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={current ? "page" : undefined}
            className={`-mb-px border-b-2 px-1 pb-2 ${
              current
                ? "border-slate-900 font-medium text-slate-900 dark:border-white dark:text-white"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
