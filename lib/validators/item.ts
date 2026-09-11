import { z } from "zod";
import { DEFAULT_REMINDER_OFFSETS_MINUTES, REMINDER_OFFSET_STEP_MINUTES } from "@/lib/constants";

// No defaults here: `itemUpdateSchema` reuses these bare fields so that an
// omitted field stays `undefined` (Prisma's `update` treats `undefined` as
// "leave unchanged"), rather than being silently reset to a default value.
const itemFieldsSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  category: z.string().trim().max(100).optional().nullable(),
  dueDate: z.iso.date("Enter a valid date"),
  dueTime: z.iso
    .time({ precision: -1, error: "Enter a valid time" })
    .optional()
    .nullable()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable(),
  visibility: z.enum(["PRIVATE", "SHARED", "CUSTOM"]),
  recurrence: z.enum(["MONTHLY", "YEARLY"]).optional().nullable(),
  reminderOffsetsMinutes: z
    .array(
      z
        .number()
        .int()
        .min(-5_256_000)
        .max(5_256_000)
        .multipleOf(REMINDER_OFFSET_STEP_MINUTES, `Must be a multiple of ${REMINDER_OFFSET_STEP_MINUTES} minutes`)
    )
    .max(20),
  userIds: z.array(z.string()).max(500),
});

function requireUserIdsForCustom(
  data: { visibility?: string; userIds?: string[] },
  ctx: z.RefinementCtx
) {
  if (data.visibility === "CUSTOM" && (data.userIds ?? []).length === 0) {
    ctx.addIssue({
      code: "custom",
      message: "Select at least one user to share this item with",
      path: ["userIds"],
    });
  }
}

export const itemInputSchema = itemFieldsSchema
  .extend({
    visibility: itemFieldsSchema.shape.visibility.default("PRIVATE"),
    reminderOffsetsMinutes: itemFieldsSchema.shape.reminderOffsetsMinutes.default(
      DEFAULT_REMINDER_OFFSETS_MINUTES
    ),
    userIds: itemFieldsSchema.shape.userIds.default([]),
  })
  .superRefine(requireUserIdsForCustom);
export type ItemInput = z.infer<typeof itemInputSchema>;

export const itemUpdateSchema = itemFieldsSchema
  .partial()
  .extend({
    completedAt: z.iso.datetime().nullable().optional(),
  })
  .superRefine(requireUserIdsForCustom);
export type ItemUpdateInput = z.infer<typeof itemUpdateSchema>;
