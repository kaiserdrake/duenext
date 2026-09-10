import { randomBytes, createHash } from "crypto";

const TOKEN_PREFIX = "duenext_pat_";

/** A new random personal access token. Only ever shown once, at creation. */
export function generateApiToken(): string {
  return `${TOKEN_PREFIX}${randomBytes(32).toString("base64url")}`;
}

/**
 * Tokens are high-entropy random strings (unlike passwords), so a fast
 * deterministic hash is fine here - it also lets us look a user up
 * directly by hash instead of comparing against every stored token.
 */
export function hashApiToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
