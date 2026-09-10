import { signOut } from "@/auth";

export default function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        Sign out
      </button>
    </form>
  );
}
