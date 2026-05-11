import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* 네이티브 애드온은 번들하지 않음 — 서버 액션에서 Prisma/SQLite 로드 실패 방지 */
  serverExternalPackages: [
    "better-sqlite3",
    "@prisma/adapter-better-sqlite3",
    "@prisma/client",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
