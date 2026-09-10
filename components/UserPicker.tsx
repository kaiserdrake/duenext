"use client";

import { useEffect, useState } from "react";

interface DirectoryUser {
  id: string;
  name: string;
  email: string;
}

export default function UserPicker({
  value,
  onChange,
  excludeUserId,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  excludeUserId?: string;
}) {
  const [users, setUsers] = useState<DirectoryUser[] | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/directory")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setUsers(data.users ?? []);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const candidates = (users ?? []).filter((u) => u.id !== excludeUserId);
  const filtered = candidates.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  return (
    <div>
      <div className="rounded-md border border-slate-300 dark:border-slate-700">
        <div className="border-b border-slate-200 p-1.5 dark:border-slate-800">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users"
            className="h-7 w-full border-none bg-transparent px-1.5 text-xs outline-none"
          />
        </div>
        <div className="max-h-48 overflow-y-auto">
          {users === null && (
            <p className="px-3 py-3 text-xs text-slate-400">Loading users…</p>
          )}
          {users !== null && filtered.length === 0 && (
            <p className="px-3 py-3 text-xs text-slate-400">No users found.</p>
          )}
          {filtered.map((u) => (
            <label
              key={u.id}
              className="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value.includes(u.id)}
                  onChange={() => toggle(u.id)}
                  className="h-auto w-auto"
                />
                {u.name}
              </span>
              <span className="text-xs text-slate-400">{u.email}</span>
            </label>
          ))}
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-400">
        {value.length} {value.length === 1 ? "person" : "people"} selected.
      </p>
    </div>
  );
}
