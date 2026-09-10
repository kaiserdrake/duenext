import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const hasError = params.error !== undefined;

  async function login(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=CredentialsSignin");
      }
      throw error;
    }
  }

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h1 className="mb-1 text-xl font-medium">DueNext</h1>
        <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
          Sign in to your account.
        </p>

        {hasError && (
          <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            That login or password isn&apos;t right.
          </p>
        )}

        <form action={login} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
              Email or username
            </label>
            <input
              id="email"
              name="email"
              type="text"
              required
              autoComplete="username"
              placeholder="you@example.com"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-slate-600 dark:text-slate-400">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <button
            type="submit"
            className="mt-2 h-9 rounded-md bg-slate-900 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
