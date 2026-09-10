import { requireAdmin } from "@/lib/auth-utils";
import UserForm from "@/components/UserForm";

export default async function NewUserPage() {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 text-lg font-medium">New user</h1>
      <UserForm currentUserId={admin.id} />
    </div>
  );
}
