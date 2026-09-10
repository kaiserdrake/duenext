// Shared between server (notification text) and client (the offsets picker
// UI) - no Node-only imports here, so it's safe in either bundle.

export function offsetLabel(offsetMinutes: number): string {
  if (offsetMinutes === 0) return "today";

  const direction = offsetMinutes > 0 ? "before" : "after";
  const abs = Math.abs(offsetMinutes);
  const days = Math.floor(abs / 1440);
  const hours = Math.floor((abs % 1440) / 60);
  const minutes = abs % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} day${days === 1 ? "" : "s"}`);
  if (hours > 0) parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  if (minutes > 0) parts.push(`${minutes} minute${minutes === 1 ? "" : "s"}`);

  return `${parts.join(" ")} ${direction}`;
}
