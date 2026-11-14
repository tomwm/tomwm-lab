import type { NextConfig } from 'next';
import path from 'path';

const isVercel = !!process.env.VERCEL;

const nextConfig: NextConfig = {
  basePath: '/sexual-elf',
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  ...(isVercel ? {} : {
    turbopack: {
      root: path.resolve(__dirname, '../..'),
    },
  }),
};

export default nextConfig;
