import path from "node:path";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/** SQLite file: URL은 cwd에 따라 엉뚱한 위치를 가리킬 수 있어 항상 절대 경로로 고정합니다. */
function resolveSqliteDatabaseUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("file:")) return trimmed;
  let rest = trimmed.slice("file:".length);
  if (rest.startsWith("//")) rest = rest.slice(2);
  rest = rest.replace(/^\/+/, "");
  const fsPath = path.isAbsolute(rest)
    ? rest
    : path.resolve(process.cwd(), rest.startsWith("./") ? rest.slice(2) : rest);
  return `file:${fsPath}`;
}

const adapter = new PrismaBetterSqlite3({
  url: resolveSqliteDatabaseUrl(process.env.DATABASE_URL ?? "file:./dev.db"),
});

export const prisma =
  (globalForPrisma.prisma &&
  // Prisma schema 변경 후 generate 했는데 dev 서버가 살아있으면,
  // global 캐시에 이전 PrismaClient 인스턴스가 남아 새 모델 delegate가 없을 수 있습니다.
  // 그 경우 새 인스턴스를 만들어 복구합니다.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalForPrisma.prisma as any).departmentOwnerOption
    ? globalForPrisma.prisma
    : new PrismaClient({
        adapter,
        log:
          process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      })) ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

