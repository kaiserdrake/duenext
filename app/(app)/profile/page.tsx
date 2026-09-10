import { requireUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-lg font-medium">Profile</h1>
      <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
        Manage your account and how you receive reminders.
      </p>
      <ProfileForm
        defaultNtfyUrl={process.env.DEFAULT_NTFY_URL ?? null}
        initial={{
          name: profile.name,
          ntfyServerUrl: profile.ntfyServerUrl ?? "",
          ntfyTopic: profile.ntfyTopic ?? "",
          ntfyAccessToken: profile.ntfyAccessToken ?? "",
          notifyByEmail: profile.notifyByEmail,
          notifyByNtfy: profile.notifyByNtfy,
        }}
      />
    </div>
  );
}
