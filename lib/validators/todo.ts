import { z } from "zod";

export const todoInputSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  notes: z.string().trim().max(2000).optional().nullable(),
});
export type TodoInput = z.infer<typeof todoInputSchema>;

export const todoUpdateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200).optional(),
  notes: z.string().trim().max(2000).optional().nullable(),
  done: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});
export type TodoUpdateInput = z.infer<typeof todoUpdateSchema>;
