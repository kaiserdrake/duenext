import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateNtfyTopic } from "@/lib/notifications/topic";

export async function ensureAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.warn(
        "[bootstrap] No users exist and ADMIN_EMAIL/ADMIN_PASSWORD are not set. " +
          "Set them and restart the container to create the first admin account."
      );
    }
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return;

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
      ntfyTopic: generateNtfyTopic(),
    },
  });

  console.log(`[bootstrap] Created initial admin user: ${email}`);
}
