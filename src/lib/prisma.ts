import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next.js는 터미널에 남은 DATABASE_URL=file:./dev.db 를 .env(Neon URL)보다 우선할 수 있음
if (typeof window === "undefined") {
  loadEnv({ path: ".env", override: true });
  loadEnv({ path: ".env.local", override: true });
}

/** schema/provider·env 로딩 변경 시 dev global 캐시 무효화 */
const PRISMA_CACHE_KEY = "postgresql-adapter-pg-v2";

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
      "DATABASE_URL is still SQLite (file:./dev.db). Close the terminal, open a new one, or run: Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue. See docs/NEON_SETUP.md."
    );
  }
  if (
    !connectionString.startsWith("postgresql://") &&
    !connectionString.startsWith("postgres://")
  ) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres:// (Neon connection string)."
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
  if (globalForPrisma.prismaCacheKey !== PRISMA_CACHE_KEY) {
    globalForPrisma.prisma = undefined;
  }

  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaCacheKey = PRISMA_CACHE_KEY;
  return client;
}

export const prisma = getPrismaClient();
