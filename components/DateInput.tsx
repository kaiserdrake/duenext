"use client";

import { useLayoutEffect, useRef } from "react";

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Joins up to 8 digits into YYYY-MM-DD, inserting dashes as each part fills. */
function formatDigitsAsDate(digits: string): string {
  const d = digits.slice(0, 8);
  return [d.slice(0, 4), d.slice(4, 6), d.slice(6, 8)].filter(Boolean).join("-");
}

/** Where the caret belongs in the dashed string after `n` digits have been typed. */
function cursorPositionForDigitCount(n: number): number {
  return n + (n >= 4 ? 1 : 0) + (n >= 6 ? 1 : 0);
}

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
 *
 * Dashes are inserted automatically as digits are typed, since iOS's
 * numeric keypad (triggered by `inputMode="numeric"`) has no "-" key.
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
  const textRef = useRef<HTMLInputElement>(null);
  const pendingCursorRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCursorRef.current !== null && textRef.current) {
      textRef.current.setSelectionRange(pendingCursorRef.current, pendingCursorRef.current);
      pendingCursorRef.current = null;
    }
  }, [value]);

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const prevDigitCount = value.replace(/\D/g, "").length;
    let digits = raw.replace(/\D/g, "").slice(0, 8);

    // Backspacing over an auto-inserted dash only removes that dash from
    // the raw value - digit count is unchanged, so nothing would appear to
    // happen. Drop the trailing digit too so backspace keeps working.
    if (raw.length < value.length && digits.length === prevDigitCount && digits.length > 0) {
      digits = digits.slice(0, -1);
    }

    const cursor = e.target.selectionStart ?? raw.length;
    const digitsBeforeCursor = raw.slice(0, cursor).replace(/\D/g, "").length;
    pendingCursorRef.current = cursorPositionForDigitCount(Math.min(digitsBeforeCursor, digits.length));

    onChange(formatDigitsAsDate(digits));
  }

  return (
    <div className="relative">
      <input
        ref={textRef}
        type="text"
        inputMode="numeric"
        value={value}
        onChange={handleTextChange}
        placeholder="YYYY-MM-DD"
        pattern="\d{4}-\d{2}-\d{2}"
        title="YYYY-MM-DD"
        required={required}
        maxLength={10}
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
