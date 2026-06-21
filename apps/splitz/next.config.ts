import type { NextConfig } from "next";
import path from "path";

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  ...(isVercel ? { basePath: "/splitz" } : {}),
  ...(isVercel ? {} : {
    turbopack: {
      root: path.resolve(__dirname, "../.."),
    },
  }),
};

export default nextConfig;
