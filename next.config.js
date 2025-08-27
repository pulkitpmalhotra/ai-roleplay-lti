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
  },
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: process.cwd(),
  },
  // NUCLEAR OPTION: Explicitly exclude problematic modules
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Exclude SQLite and other problematic modules
    config.externals = config.externals || [];
    
    if (isServer) {
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
        'sqlite3': 'commonjs sqlite3',
        'mongodb': 'commonjs mongodb',
      });
    }

    // Ignore any files that might contain SQLite
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^(better-sqlite3|sqlite3|mongodb)$/,
      })
    );

    // Also ignore our problematic files if they still exist
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /database\.js$/,
      })
    );

    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /database-mongodb\.js$/,
      })
    );

    return config;
  },
  
  // Additional safety measures
  async generateBuildId() {
    return 'clean-build-' + Date.now();
  },
}

module.exports = nextConfig
