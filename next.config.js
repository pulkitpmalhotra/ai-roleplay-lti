/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    EMERGENT_LLM_KEY: process.env.EMERGENT_LLM_KEY,
    LTI_SECRET: process.env.LTI_SECRET,
    LTI_KEY: process.env.LTI_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    APP_URL: process.env.APP_URL,
  },
  // Ensure all pages are dynamically rendered for database access
  output: 'standalone',
  // Optimize for serverless deployment
  experimental: {
    outputFileTracingRoot: process.cwd(),
  }
}

module.exports = nextConfig