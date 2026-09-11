// In minutes: 1 day before, and 2 hours before.
export const DEFAULT_REMINDER_OFFSETS_MINUTES = [1440, 120];

// The scheduler checks every 5 minutes, so finer-grained offsets aren't
// meaningful - values must be a multiple of this.
export const REMINDER_OFFSET_STEP_MINUTES = 5;

export const CATEGORY_SUGGESTIONS = [
  "Document",
  "Subscription",
  "Bill",
  "Appointment",
  "Event",
  "Other",
];

export const RECURRENCE_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "YEARLY", label: "Yearly" },
] as const;
