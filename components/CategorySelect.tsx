"use client";

import { useEffect, useRef, useState } from "react";
import CategoryIcon from "@/components/CategoryIcon";
import { CATEGORY_SUGGESTIONS } from "@/lib/constants";

export default function CategorySelect({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  className?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  // Separate from `value`: filtering should react to what's actively being
  // typed, not the field's existing value - otherwise opening a field
  // pre-filled with e.g. "Appointment" would filter the list down to just
  // that one exact match instead of showing all the other options too.
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const filtered = query.trim()
    ? CATEGORY_SUGGESTIONS.filter((c) => c.toLowerCase().includes(query.trim().toLowerCase()))
    : CATEGORY_SUGGESTIONS;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setQuery("");
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-slate-300 bg-white py-1 text-sm shadow-md dark:border-slate-700 dark:bg-slate-950">
          {filtered.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <CategoryIcon category={c} className="shrink-0 text-slate-400" />
                {c}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
