import { requireUser } from "@/lib/auth-utils";
import SettingsNav from "@/components/SettingsNav";

export default async function SettingsLayout({ children }: LayoutProps<"/settings">) {
  const user = await requireUser();

  return (
    <div>
      <h1 className="mb-4 text-lg font-medium">Settings</h1>
      <SettingsNav isAdmin={user.role === "ADMIN"} />
      {children}
    </div>
  );
}
