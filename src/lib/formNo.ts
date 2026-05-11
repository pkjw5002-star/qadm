import type { PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

function readNoIndex(no: unknown, prefix: string): number | null {
  if (typeof no !== "string") return null;
  const re = new RegExp(`^${prefix}\\d{4}$`);
  if (!re.test(no)) return null;
  const n = parseInt(no.slice(prefix.length), 10);
  return Number.isFinite(n) ? n : null;
}

function maxGlobalIndex(forms: { title: string; data: unknown }[]): number {
  let max = 0;
  for (const f of forms) {
    const d = f.data as
      | {
          complaint?: { formNo?: unknown };
          qualityImprovement?: { formNo?: unknown };
          abnormalReport?: { formNo?: unknown };
          workCoop?: { formNo?: unknown };
          suggestion?: { formNo?: unknown };
        }
      | null;

    const candidates: (number | null)[] = [
      readNoIndex(d?.complaint?.formNo, "불"),
      readNoIndex(d?.qualityImprovement?.formNo, "품"),
      readNoIndex(d?.abnormalReport?.formNo, "이"),
      readNoIndex(d?.workCoop?.formNo, "협"),
      readNoIndex(d?.suggestion?.formNo, "제"),
      readNoIndex(f.title, "불"),
      readNoIndex(f.title, "품"),
      readNoIndex(f.title, "이"),
      readNoIndex(f.title, "협"),
      readNoIndex(f.title, "제"),
    ];

    for (const c of candidates) {
      if (c !== null && c > max) max = c;
    }
  }
  return max;
}

async function getNextGlobalIndex(
  db: PrismaClient["form"] = prisma.form
): Promise<number> {
  const forms = await db.findMany({
    select: { title: true, data: true },
  });
  const next = maxGlobalIndex(forms) + 1;
  if (next > 9999) {
    throw new Error("서식 번호가 9999를 초과했습니다.");
  }
  return next;
}

/** 공통 연속 번호 기반: 불만신고서 NO(불0001 …) */
export async function getNextComplaintFormNo(
  db: PrismaClient["form"] = prisma.form
): Promise<string> {
  const next = await getNextGlobalIndex(db);
  return `불${String(next).padStart(4, "0")}`;
}

/** 공통 연속 번호 기반: 품질개선의뢰서 NO(품0001 …) */
export async function getNextQualityImprovementFormNo(
  db: PrismaClient["form"] = prisma.form
): Promise<string> {
  const next = await getNextGlobalIndex(db);
  return `품${String(next).padStart(4, "0")}`;
}

/** 공통 연속 번호 기반: 이상발생신고서 NO(이0001 …) */
export async function getNextAbnormalReportFormNo(
  db: PrismaClient["form"] = prisma.form
): Promise<string> {
  const next = await getNextGlobalIndex(db);
  return `이${String(next).padStart(4, "0")}`;
}

/** 공통 연속 번호 기반: 업무협조전 NO(협0001 …) */
export async function getNextWorkCoopFormNo(
  db: PrismaClient["form"] = prisma.form
): Promise<string> {
  const next = await getNextGlobalIndex(db);
  return `협${String(next).padStart(4, "0")}`;
}

/** 공통 연속 번호 기반: 제안서 NO(제0001 …) */
export async function getNextSuggestionFormNo(
  db: PrismaClient["form"] = prisma.form
): Promise<string> {
  const next = await getNextGlobalIndex(db);
  return `제${String(next).padStart(4, "0")}`;
}

