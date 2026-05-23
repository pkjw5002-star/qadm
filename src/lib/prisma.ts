import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/** schema/provider 변경 시 dev 서버 global 캐시를 무효화하기 위한 키 */
const PRISMA_CACHE_KEY = "postgresql-adapter-pg-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. See docs/NEON_SETUP.md for Neon PostgreSQL setup."
    );
  }
  if (
    connectionString.startsWith("file:") ||
    connectionString.startsWith("sqlite:")
  ) {
    throw new Error(
      "SQLite (file:./dev.db) is no longer supported. Set DATABASE_URL to a Neon postgresql:// URL. See docs/NEON_SETUP.md."
    );
  }

  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (
    globalForPrisma.prisma &&
    globalForPrisma.prismaCacheKey === PRISMA_CACHE_KEY
  ) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY;
  }
  return client;
}

export const prisma = getPrismaClient();
