import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // node:sqlite is a runtime builtin; keep it out of the bundler's graph.
  serverExternalPackages: ['node:sqlite'],
  devIndicators: false,
}

export default nextConfig
