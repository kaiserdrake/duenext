import { z } from "zod";

const taskType = z.enum(["SHORT", "LONG", "FREE"]);

// An optional deadline; "" clears it. Same formats as an item's due date/time.
const dueDate = z.iso.date("Enter a valid date").optional().nullable().or(z.literal(""));
const dueTime = z.iso
  .time({ precision: -1, error: "Enter a valid time" })
  .optional()
  .nullable()
  .or(z.literal(""));

export const taskInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: z.string().trim().max(2000).optional().nullable(),
  type: taskType.default("SHORT"),
  dueDate,
  dueTime,
});
export type TaskInput = z.infer<typeof taskInputSchema>;

export const taskUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  type: taskType.optional(),
  dueDate,
  dueTime,
});
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;

// Moves between board sections and timer phase changes. `queue` covers both
// "put back" (from Active) and "restore" (from Done); `index` is the position
// in the queue to drop it at, appending when omitted.
export const taskActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("activate") }),
  z.object({ action: z.literal("queue"), index: z.number().int().min(0).optional() }),
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("startRest") }),
  z.object({ action: z.literal("startWork") }),
]);
export type TaskAction = z.infer<typeof taskActionSchema>;

export const taskReorderSchema = z.object({
  ids: z.array(z.string()).max(1000),
});
