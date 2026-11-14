import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE, authToken } from "@/lib/auth-token";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// Relative Location headers, for the same reason as middleware.ts: behind the
// lab.tomwm.co.uk rewrite the request's own host is the upstream *.vercel.app
// one, so an absolute redirect would move her off the lab domain. 303 so the
// browser follows with a GET rather than re-POSTing the form.
function redirectTo(location: string) {
  return new NextResponse(null, { status: 303, headers: { Location: location } });
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const passcode = String(form.get("passcode") ?? "");
  // `next` is an in-app path without the base path ("/practice"). Same-app
  // paths only: a leading double slash would be read as a different host.
  const rawNext = String(form.get("next") ?? "/");
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
  const expected = process.env.APP_PASSCODE;

  if (!expected || passcode !== expected) {
    return redirectTo(`${BASE_PATH}/login?error=1&next=${encodeURIComponent(next)}`);
  }

  const res = redirectTo(`${BASE_PATH}${next}`);
  res.cookies.set(AUTH_COOKIE, await authToken(passcode), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 180,
    // Scoped to this app: every app on lab.tomwm.co.uk shares the host.
    path: BASE_PATH || "/",
  });
  return res;
}
