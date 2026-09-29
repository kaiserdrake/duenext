import NextAuth from "next-auth";
import { headers } from "next/headers";
import type { NextRequest } from "next/server";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role } from "@/lib/generated/prisma/enums";

// Auth.js's default SameSite=Lax cookies aren't sent (or are blocked outright
// as third-party cookies) when DueNext runs inside another site's iframe,
// e.g. a Home Assistant Webpage dashboard - so every visit lands on /login.
// AUTH_ALLOW_EMBED switches the auth cookies to SameSite=None (which requires
// Secure) and Partitioned (CHIPS), so browsers that block third-party cookies
// still keep a separate jar for the embedded copy.
const embedCookieOptions = {
  httpOnly: true,
  sameSite: "none",
  path: "/",
  secure: true,
  partitioned: true,
} as const;

const embedCookies = {
  sessionToken: { name: "__Secure-authjs.session-token", options: embedCookieOptions },
  callbackUrl: { name: "__Secure-authjs.callback-url", options: embedCookieOptions },
  csrfToken: { name: "__Host-authjs.csrf-token", options: embedCookieOptions },
};

// Secure cookies are silently dropped over plain http - e.g. opening the app
// at http://<lan-ip>:3000 because the router can't hairpin the public
// hostname - which would bounce every navigation back to /login. So the
// embed cookies only apply to requests that actually arrived over HTTPS
// (directly, or via the reverse proxy's X-Forwarded-Proto); anything else
// keeps Auth.js's defaults.
async function isHttpsRequest(request: NextRequest | undefined): Promise<boolean> {
  const forwardedProto = request
    ? request.headers.get("x-forwarded-proto")
    : (await headers()).get("x-forwarded-proto");
  if (forwardedProto) return forwardedProto.split(",")[0].trim() === "https";
  return request?.nextUrl.protocol === "https:";
}

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth(async (request) => ({
  // 120 days. The proxy re-issues the JWT cookie with a fresh expiry as you
  // browse, so this is really "signed out after 120 days of not visiting".
  session: { strategy: "jwt", maxAge: 120 * 24 * 60 * 60 },
  cookies:
    process.env.AUTH_ALLOW_EMBED === "true" && (await isHttpsRequest(request))
      ? embedCookies
      : undefined,
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : null;
        const password =
          typeof credentials?.password === "string" ? credentials.password : null;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.isActive) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      // `next-auth/jwt`'s JWT type doesn't pick up the module augmentation
      // below in this beta release, so the custom fields read back as
      // `unknown` here even though they're set in the `jwt` callback above.
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      return session;
    },
    async authorized({ request, auth }) {
      const { pathname } = request.nextUrl;

      if (pathname.startsWith("/admin")) {
        return auth?.user?.role === "ADMIN";
      }

      return !!auth?.user;
    },
  },
}));
