import { z } from "zod";

// The login identifier doesn't have to be an email address (e.g. "admin" is
// fine) - it's only treated as one when actually sending email reminders,
// which is skipped gracefully for identifiers that aren't a valid address.
export const userCreateSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Required")
    .max(320)
    .regex(/^\S+$/, "No spaces allowed"),
  name: z.string().trim().min(1, "Name is required").max(200),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  role: z.enum(["ADMIN", "USER"]).default("USER"),
});
export type UserCreateInput = z.infer<typeof userCreateSchema>;

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  role: z.enum(["ADMIN", "USER"]).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(8).max(200).optional(),
});
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
