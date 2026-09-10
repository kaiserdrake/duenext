"use client";

import { useRef } from "react";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function CalendarIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

/**
 * A date field that's freely text-editable (type "2026-09-15" directly)
 * rather than the browser-locale-formatted segments a native
 * `<input type="date">` forces on you - which also can't be told to
 * display YYYY-MM-DD specifically, since that follows the browser's own
 * locale setting, not anything the page controls. A picker is still
 * available via the calendar button, backed by a visually-hidden native
 * date input synced to the same value.
 */
export default function DateInput({
  value,
  onChange,
  required,
  className,
}: {
  value: string;
  onChange: (next: string) => void;
  required?: boolean;
  className?: string;
}) {
  const pickerRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        title="YYYY-MM-DD"
        required={required}
        className={`${className} w-full pr-9`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => pickerRef.current?.showPicker?.()}
        aria-label="Open calendar"
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400"
      >
        <CalendarIcon />
      </button>
      <input
        ref={pickerRef}
        type="date"
        tabIndex={-1}
        aria-hidden="true"
        value={ISO_DATE_PATTERN.test(value) ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className="pointer-events-none absolute inset-0 opacity-0"
      />
    </div>
  );
}
