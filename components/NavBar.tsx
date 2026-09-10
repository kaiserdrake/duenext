import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";
import type { CurrentUser } from "@/lib/auth-utils";

export default function NavBar({ user }: { user: CurrentUser }) {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-medium">
            DueNext
          </Link>
          <nav className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
            <Link href="/" className="hover:text-slate-900 dark:hover:text-white">
              Dashboard
            </Link>
            <Link href="/items/new" className="hover:text-slate-900 dark:hover:text-white">
              New item
            </Link>
            <Link href="/profile" className="hover:text-slate-900 dark:hover:text-white">
              Profile
            </Link>
            {user.role === "ADMIN" && (
              <Link href="/admin/users" className="hover:text-slate-900 dark:hover:text-white">
                Settings
              </Link>
            )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500 dark:text-slate-400">{user.name}</span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
