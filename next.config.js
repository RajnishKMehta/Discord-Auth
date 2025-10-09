/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // Environment variables available on the client side (if needed)
  env: {
    CALLBACK_URL: process.env.CALLBACK_URL,
  },
}

module.exports = nextConfig
