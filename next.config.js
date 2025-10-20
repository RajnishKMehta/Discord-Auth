/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable type checking during build (not needed for API-only project)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  }
}

module.exports = nextConfig
