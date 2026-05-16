/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingExcludes: {
    '*': ['node_modules/better-sqlite3/**/*'],
  },
};
module.exports = nextConfig;
