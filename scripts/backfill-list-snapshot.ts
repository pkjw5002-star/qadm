/**
 * 기존 Form 행에 listSnapshot 을 채웁니다 (최초 1회).
 *
 *   npm run backfill:list-snapshot
 */
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { Prisma, PrismaClient } from "../src/generated/prisma/client";
import { buildListSnapshot } from "../src/lib/formListSnapshot";

loadEnv({ path: ".env", override: true });
loadEnv({ path: ".env.local", override: true });

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: url }),
  });

  let updated = 0;

  const rows = await prisma.form.findMany({
    where: { listSnapshot: { equals: Prisma.DbNull } },
    select: {
      id: true,
      type: true,
      title: true,
      data: true,
      createdAt: true,
      createdBy: { select: { name: true } },
    },
  });

  for (const row of rows) {
    const snap = buildListSnapshot({
      type: row.type,
      data: row.data,
      title: row.title,
      authorName: row.createdBy.name,
      createdAt: row.createdAt,
    });
    if (!snap) continue;
    await prisma.form.update({
      where: { id: row.id },
      data: { listSnapshot: snap as Prisma.InputJsonValue },
    });
    updated += 1;
  }

  console.log(`Done. ${updated} / ${rows.length} forms updated.`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
