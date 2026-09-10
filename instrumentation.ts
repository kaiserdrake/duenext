export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { ensureAdminUser } = await import("@/lib/bootstrap/seedAdmin");
  const { startScheduler } = await import("@/lib/scheduler");

  await ensureAdminUser();
  startScheduler();
}
