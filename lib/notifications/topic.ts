import { randomBytes } from "crypto";

/**
 * Generates a long, random Ntfy topic name. Ntfy servers without access
 * control rely entirely on the topic name being unguessable - anyone who
 * knows it can subscribe or publish - so this uses 72 bits of randomness
 * rather than a short/predictable name.
 */
export function generateNtfyTopic(): string {
  return `duenext-${randomBytes(9).toString("base64url")}`;
}
