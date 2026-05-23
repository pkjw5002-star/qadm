import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
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

export const prisma =
  (globalForPrisma.prisma &&
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalForPrisma.prisma as any).departmentOwnerOption
    ? globalForPrisma.prisma
    : createPrismaClient()) ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
