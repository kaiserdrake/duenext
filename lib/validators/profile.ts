import { z } from "zod";

export const profileUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    currentPassword: z.string().optional(),
    newPassword: z.string().min(8, "Password must be at least 8 characters").max(200).optional(),
    ntfyServerUrl: z.url("Enter a valid URL").optional().nullable().or(z.literal("")),
    ntfyTopic: z.string().trim().max(200).optional().nullable().or(z.literal("")),
    ntfyAccessToken: z.string().trim().max(500).optional().nullable().or(z.literal("")),
    notifyByEmail: z.boolean().optional(),
    notifyByNtfy: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword && !data.currentPassword) {
      ctx.addIssue({
        code: "custom",
        message: "Enter your current password to set a new one",
        path: ["currentPassword"],
      });
    }
  });
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
