import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight route guard. Checks for the Auth.js session cookie and redirects
 * unauthenticated users to /login (and authenticated users away from /login).
 * This is a UX redirect only — authoritative checks run server-side via auth()
 * in server components and actions. Kept dependency-free so it stays edge-safe.
 */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
];

export function middleware(req: NextRequest) {
  const hasSession = SESSION_COOKIES.some((c) => req.cookies.has(c));
  const { pathname } = req.nextUrl;
  const isAuthRoute = pathname === "/login";

  if (!hasSession && !isAuthRoute) {
    const url = new URL("/login", req.nextUrl);
    return NextResponse.redirect(url);
  }
  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
