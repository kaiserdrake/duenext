import { redirect } from "next/navigation";
import NavBar from "@/components/NavBar";
import { getCurrentUser } from "@/lib/auth-utils";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col">
      <NavBar user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
