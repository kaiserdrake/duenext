import Link from "next/link";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import UserTable from "@/components/UserTable";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-lg font-medium">Users</h1>
        <Link
          href="/admin/users/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
        >
          New user
        </Link>
      </div>
      <UserTable users={users} />
    </div>
  );
}
