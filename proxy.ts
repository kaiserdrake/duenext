export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    // All /api/* routes are excluded: they authenticate themselves (session
    // cookie OR a personal API token via `Authorization: Bearer`), via
    // requireApiUser/requireApiAdmin. Gating them here too would only ever
    // see the cookie, so a valid bearer-token request with no session would
    // get redirected to /login before the route handler even runs.
    //
    // Static files in public/ (logo.png, favicon.ico, etc.) are matched by
    // the file-extension exclusion, not by name, so anything added there
    // later stays publicly reachable without needing another entry here.
    "/((?!api/|login|_next/static|_next/image|.*\\.(?:ico|png|svg|jpg|jpeg|gif|webp)$).*)",
  ],
};
