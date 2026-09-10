export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    // Static files in public/ (logo.png, favicon.ico, etc.) are matched by
    // the file-extension exclusion, not by name, so anything added there
    // later stays publicly reachable without needing another entry here.
    "/((?!api/auth|api/health|login|_next/static|_next/image|.*\\.(?:ico|png|svg|jpg|jpeg|gif|webp)$).*)",
  ],
};
