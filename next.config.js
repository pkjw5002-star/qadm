/** @type {import('next').NextConfig} */
const nextConfig = {
  // 서식 사진(최대 8MB×여러 필드) — 기본 1MB면 수정/저장 시 "Failed to fetch"
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    optimizePackageImports: [
      "firebase/app",
      "firebase/storage",
      "firebase/firestore",
    ],
  },
  serverExternalPackages: [
    "pg",
    "@prisma/adapter-pg",
    "@prisma/adapter-neon",
    "@neondatabase/serverless",
    "@prisma/client",
    "firebase-admin",
  ],
};
module.exports = nextConfig;
