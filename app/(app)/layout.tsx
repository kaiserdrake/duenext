import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import NavBar from "@/components/NavBar";
import SignOutButton from "@/components/SignOutButton";
import { getCurrentUser } from "@/lib/auth-utils";
import { isTaskBoardEnabled } from "@/lib/tasks";
import AppMain from "@/components/AppMain";
import { THEME_COOKIE } from "@/lib/theme";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const wideDashboard = await isTaskBoardEnabled(user.id);
  const themeInitial = (await cookies()).get(THEME_COOKIE)?.value;

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar
        user={user}
        signOutButton={<SignOutButton />}
        wideDashboard={wideDashboard}
        themeInitial={themeInitial}
      />
      <AppMain wideDashboard={wideDashboard}>{children}</AppMain>
    </div>
  );
}
