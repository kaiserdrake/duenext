"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export interface UserFormValues {
  id?: string;
  email: string;
  name: string;
  role: "ADMIN" | "USER";
  isActive: boolean;
}

export default function UserForm({
  initial,
  currentUserId,
}: {
  initial?: UserFormValues;
  currentUserId: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);
  const isSelf = initial?.id === currentUserId;

  const [email, setEmail] = useState(initial?.email ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [role, setRole] = useState<"ADMIN" | "USER">(initial?.role ?? "USER");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [password, setPassword] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const url = isEdit ? `/api/users/${initial!.id}` : "/api/users";
    const method = isEdit ? "PATCH" : "POST";
    const body = isEdit
      ? { name, role, isActive, ...(password ? { password } : {}) }
      : { email, name, role, password };

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong");
      setSubmitting(false);
      return;
    }

    router.push("/admin/users");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(`Delete ${initial.name}? Their items will also be deleted. This can't be undone.`)) {
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/users/${initial.id}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/users");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't delete this user");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
          Email or username
        </label>
        <input
          type="text"
          required
          disabled={isEdit}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
        />
        <p className="mt-1 text-xs text-slate-400">
          Used to log in. Only needs to be a real email address if this user wants email
          reminders.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Role</label>
          <select
            value={role}
            disabled={isSelf}
            onChange={(e) => setRole(e.target.value as "ADMIN" | "USER")}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        {isEdit && (
          <div>
            <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">Status</label>
            <select
              value={isActive ? "active" : "inactive"}
              disabled={isSelf}
              onChange={(e) => setIsActive(e.target.value === "active")}
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
          {isEdit ? "Reset password (optional)" : "Password"}
        </label>
        <input
          type="password"
          required={!isEdit}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        {isEdit && !isSelf ? (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-400"
          >
            Delete user
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/users")}
            className="h-9 rounded-md border border-slate-300 px-4 text-sm dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="h-9 rounded-md bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Save
          </button>
        </div>
      </div>
    </form>
  );
}
