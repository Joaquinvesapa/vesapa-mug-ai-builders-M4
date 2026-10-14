import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIES = ["__Secure-authjs.session-token", "authjs.session-token"];
const PUBLIC_PATHS = ["/login"];
const SESSION_MAX_AGE_S = 30 * 24 * 60 * 60;

/**
 * Optimistic check only: redirects pages without a session cookie to /login and
 * refreshes the cookie lifetime on use (FR-083). Real authorization runs on the server.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const cookie = SESSION_COOKIES.map((name) => request.cookies.get(name)).find(Boolean);
  const isApi = pathname.startsWith("/api/");

  if (!cookie) {
    if (isApi || PUBLIC_PATHS.includes(pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();
  response.cookies.set(cookie.name, cookie.value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cookie.name.startsWith("__Secure-"),
    maxAge: SESSION_MAX_AGE_S,
  });
  return response;
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|fonts/).*)"],
};
