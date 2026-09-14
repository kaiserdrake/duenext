"use client";

import { useMemo, useState } from "react";
import ItemCard from "@/components/ItemCard";
import type { ItemWithRelations } from "@/lib/items";
import { CATEGORY_SUGGESTIONS } from "@/lib/constants";

const controlClass =
  "h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950";

export default function ArchiveList({
  items,
  currentUserId,
}: {
  items: ItemWithRelations[];
  currentUserId: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const categories = useMemo(() => {
    const present = items.map((item) => item.category).filter((c): c is string => Boolean(c));
    return Array.from(new Set([...CATEGORY_SUGGESTIONS, ...present])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (category && item.category?.toLowerCase() !== category.toLowerCase()) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.notes?.toLowerCase().includes(q)
      );
    });
  }, [items, query, category]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, category, or notes"
          className={`${controlClass} w-full sm:flex-1`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={`${controlClass} sm:w-48`}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Nothing archived yet. Items you mark as done show up here.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 px-4 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No archived items match your search.
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item) => (
            <ItemCard key={item.id} item={item} currentUserId={currentUserId} showTemplateAction />
          ))}
        </div>
      )}
    </div>
  );
}
