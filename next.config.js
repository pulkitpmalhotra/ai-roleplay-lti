/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  env: {
    EMERGENT_LLM_KEY: process.env.EMERGENT_LLM_KEY,
    LTI_SECRET: process.env.LTI_SECRET,
    LTI_KEY: process.env.LTI_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    APP_URL: process.env.APP_URL,
  },
}

module.exports = nextConfig