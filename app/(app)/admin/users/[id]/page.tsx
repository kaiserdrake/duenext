import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import UserForm from "@/components/UserForm";

export default async function EditUserPage({
  params,
}: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const admin = await requireAdmin();

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true, isActive: true },
  });

  if (!user) notFound();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-lg font-medium">Edit user</h1>
      <UserForm currentUserId={admin.id} initial={user} />
    </div>
  );
}
