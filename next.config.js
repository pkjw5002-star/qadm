/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "pg",
    "@prisma/adapter-pg",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
    "@prisma/client",
  ],
};
module.exports = nextConfig;
