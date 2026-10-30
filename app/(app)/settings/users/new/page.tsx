import { requireAdmin } from "@/lib/auth-utils";
import UserForm from "@/components/UserForm";

export default async function NewUserPage() {
  const admin = await requireAdmin();

  return (
    <div className="mx-auto max-w-lg">
      <h2 className="mb-6 text-base font-medium">New user</h2>
      <UserForm currentUserId={admin.id} />
    </div>
  );
}
