// Shared by the middleware (edge runtime) and the login route (Node), so it
// uses Web Crypto, which both have.

export const AUTH_COOKIE = "rl_auth";

/**
 * The value stored in the auth cookie: a hash of the passcode, never the
 * passcode itself. Every app on lab.tomwm.co.uk shares the host, and a cookie
 * holding the raw passcode would hand it to anything that can read cookies.
 *
 * Unsalted and unkeyed, so a short passcode is still guessable offline from a
 * stolen cookie — this keeps a family member's essays out of casual reach, it
 * isn't account security.
 */
export async function authToken(passcode: string): Promise<string> {
  const data = new TextEncoder().encode(`revisionlab:${passcode}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
