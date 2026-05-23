import { config as loadEnv } from "dotenv";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

if (typeof window === "undefined") {
  loadEnv({ path: ".env", override: true });
  loadEnv({ path: ".env.local", override: true });
}

const PRISMA_CACHE_KEY = "neon-serverless-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaCacheKey?: string;
};

function assertDatabaseUrl(raw: string | undefined): string {
  const connectionString = raw?.trim();
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
      "SQLite is no longer supported. Use Neon postgresql:// URL. See docs/NEON_SETUP.md."
    );
  }
  if (
    !connectionString.startsWith("postgresql://") &&
    !connectionString.startsWith("postgres://")
  ) {
    throw new Error(
      "DATABASE_URL must start with postgresql:// or postgres://."
    );
  }
  return connectionString;
}

function createPrismaClient(): PrismaClient {
  const connectionString = assertDatabaseUrl(process.env.DATABASE_URL);

  const adapter =
    connectionString.includes("neon.tech") ||
    connectionString.includes("neon.database")
      ? new PrismaNeon({ connectionString })
      : new PrismaPg({ connectionString });

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
