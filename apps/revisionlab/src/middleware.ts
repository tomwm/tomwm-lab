import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth-token";

// Lightweight shared-passcode gate. Only active if APP_PASSCODE is set — this
// is a personal, single-user app with no accounts, but essays and notes
// should not be publicly readable if deployed to a public Vercel URL.

// The basePath is handled by hand here. In middleware, nextUrl.pathname still
// carries the /revisionlab prefix, so the exemptions below match on the path
// with it stripped. Behaves the same locally (no prefix) and on Vercel.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

function appPath(pathname: string): string {
  if (!BASE_PATH || !pathname.startsWith(BASE_PATH)) return pathname;
  return pathname.slice(BASE_PATH.length) || "/";
}

export async function middleware(req: NextRequest) {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) return NextResponse.next();

  const path = appPath(req.nextUrl.pathname);
  if (path === "/login" || path.startsWith("/api/login") || path.startsWith("/_next")) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get(AUTH_COOKIE)?.value;
  if (cookie && cookie === (await authToken(passcode))) return NextResponse.next();

  // Show the login page in place instead of redirecting. Middleware can't send
  // a relative Location (Next rewrites it into an absolute URL, and crashes on
  // a bare path), and the only host it knows is the upstream *.vercel.app one —
  // behind the lab.tomwm.co.uk rewrite, a redirect would bounce her onto that
  // domain. A rewrite leaves the address bar where she is; the form carries
  // `next`, and the login route answers with a relative redirect.
  const login = new URL(`${BASE_PATH}/login`, req.url);
  login.searchParams.set("next", path);
  return NextResponse.rewrite(login);
}

export const config = {
  // "/" is listed explicitly: under a basePath the app root (/revisionlab) is not
  // matched by the catch-all pattern, and without it the dashboard was served
  // with no passcode check at all.
  matcher: ["/", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
