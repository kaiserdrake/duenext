import Link from "next/link";

export interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
}

export default function UserTable({ users }: { users: UserRow[] }) {
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-4 py-2 font-medium">Name</th>
            <th className="px-4 py-2 font-medium">Email</th>
            <th className="px-4 py-2 font-medium">Role</th>
            <th className="px-4 py-2 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-slate-100 last:border-0 dark:border-slate-800/60">
              <td className="px-4 py-2">
                <Link href={`/admin/users/${user.id}`} className="hover:underline">
                  {user.name}
                </Link>
              </td>
              <td className="px-4 py-2 text-slate-500 dark:text-slate-400">{user.email}</td>
              <td className="px-4 py-2">{user.role === "ADMIN" ? "Admin" : "User"}</td>
              <td className="px-4 py-2">
                {user.isActive ? (
                  <span className="text-green-700 dark:text-green-400">Active</span>
                ) : (
                  <span className="text-slate-400">Deactivated</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
