import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // node:sqlite is a runtime builtin; keep it out of the bundler's graph.
  serverExternalPackages: ['node:sqlite'],
  devIndicators: false,
  // The Dock launcher builds into its own folder so it never clashes with `npm run dev`.
  distDir: process.env.GARMIN_ME_DIST || '.next',
}

export default nextConfig
