import type { NextConfig } from "next";

// Served at lab.tomwm.co.uk/revisionlab through a rewrite in the root
// vercel.json, so the prefix applies only to Vercel builds — locally the app
// runs at /. Same pattern as apps/splitz.
const basePath = process.env.VERCEL ? "/revisionlab" : "";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath } : {}),
  // basePath covers <Link>, router and redirect(), but not plain <a>/<form>
  // URLs or the auth cookie's path — those read this instead.
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  serverExternalPackages: ["@libsql/client", "libsql"],
};

export default nextConfig;
