/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    AI_API_KEY: process.env.AI_API_KEY,
    LTI_SECRET: process.env.LTI_SECRET,
    LTI_KEY: process.env.LTI_KEY,
    JWT_SECRET: process.env.JWT_SECRET,
    ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
    APP_URL: process.env.APP_URL,
    NODE_ENV: process.env.NODE_ENV,
    // Supabase keys are already available via NEXT_PUBLIC_ prefix
  },
  // Ensure all pages are dynamically rendered for database access
  output: 'standalone',
  // Optimize for serverless deployment
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  // Generate static pages where possible, but allow dynamic rendering
  trailingSlash: false,
  // Disable static optimization for pages that need dynamic data
  // This prevents the build-time API calls that were causing the error
  async generateBuildId() {
    // You can return any string here, like a git commit hash
    return 'build-' + Date.now();
  }
}

module.exports = nextConfig
