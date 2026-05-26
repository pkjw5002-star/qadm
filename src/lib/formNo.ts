import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const GLOBAL_SEQ_ID = "global";

const PREFIXES = {
  complaint: "불",
  qualityImprovement: "품",
  abnormalReport: "이",
  workCoop: "협",
  suggestion: "제",
} as const;

type DbClient = PrismaClient | Prisma.TransactionClient;

function readNoIndex(no: unknown, prefix: string): number | null {
  if (typeof no !== "string") return null;
  const re = new RegExp(`^${prefix}\\d{4}$`);
  if (!re.test(no)) return null;
  const n = parseInt(no.slice(prefix.length), 10);
  return Number.isFinite(n) ? n : null;
}

function maxGlobalIndexFromForms(
  forms: { title: string; data: unknown }[]
): number {
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
      readNoIndex(d?.complaint?.formNo, PREFIXES.complaint),
      readNoIndex(d?.qualityImprovement?.formNo, PREFIXES.qualityImprovement),
      readNoIndex(d?.abnormalReport?.formNo, PREFIXES.abnormalReport),
      readNoIndex(d?.workCoop?.formNo, PREFIXES.workCoop),
      readNoIndex(d?.suggestion?.formNo, PREFIXES.suggestion),
      readNoIndex(f.title, PREFIXES.complaint),
      readNoIndex(f.title, PREFIXES.qualityImprovement),
      readNoIndex(f.title, PREFIXES.abnormalReport),
      readNoIndex(f.title, PREFIXES.workCoop),
      readNoIndex(f.title, PREFIXES.suggestion),
    ];

    for (const c of candidates) {
      if (c !== null && c > max) max = c;
    }
  }
  return max;
}

export function formatFormNo(prefix: string, index: number): string {
  if (index > 9999) {
    throw new Error("서식 번호가 9999를 초과했습니다.");
  }
  return `${prefix}${String(index).padStart(4, "0")}`;
}

async function ensureSequenceInitialized(client: DbClient): Promise<void> {
  const existing = await client.formNumberSequence.findUnique({
    where: { id: GLOBAL_SEQ_ID },
    select: { id: true },
  });
  if (existing) return;

  const forms = await client.form.findMany({
    select: { title: true, data: true },
  });
  const initial = maxGlobalIndexFromForms(forms);

  try {
    await client.formNumberSequence.create({
      data: { id: GLOBAL_SEQ_ID, value: initial },
    });
  } catch {
    /* 동시 초기화 시 한쪽만 성공 */
  }
}

/** 다음에 할당될 번호(미리보기용, 시퀀스 소비 없음) */
async function peekNextGlobalIndex(
  client: DbClient = prisma
): Promise<number> {
  await ensureSequenceInitialized(client);
  const row = await client.formNumberSequence.findUnique({
    where: { id: GLOBAL_SEQ_ID },
    select: { value: true },
  });
  if (row) {
    const next = row.value + 1;
    if (next > 9999) throw new Error("서식 번호가 9999를 초과했습니다.");
    return next;
  }

  const forms = await client.form.findMany({
    select: { title: true, data: true },
  });
  const next = maxGlobalIndexFromForms(forms) + 1;
  if (next > 9999) throw new Error("서식 번호가 9999를 초과했습니다.");
  return next;
}

/** 시퀀스를 1 증가시키고 새 번호를 반환 */
async function allocateNextGlobalIndex(
  client: DbClient = prisma
): Promise<number> {
  await ensureSequenceInitialized(client);
  const updated = await client.formNumberSequence.update({
    where: { id: GLOBAL_SEQ_ID },
    data: { value: { increment: 1 } },
    select: { value: true },
  });
  if (updated.value > 9999) {
    throw new Error("서식 번호가 9999를 초과했습니다.");
  }
  return updated.value;
}

export type PreviewFormNumbers = {
  complaint: string;
  qualityImprovement: string;
  abnormalReport: string;
  workCoop: string;
  suggestion: string;
};

/** 신규 작성 화면: DB 스캔 1회(또는 시퀀스 peek)로 5종 NO 미리보기 */
export async function getPreviewFormNumbers(
  client: DbClient = prisma
): Promise<PreviewFormNumbers> {
  const next = await peekNextGlobalIndex(client);
  return {
    complaint: formatFormNo(PREFIXES.complaint, next),
    qualityImprovement: formatFormNo(PREFIXES.qualityImprovement, next),
    abnormalReport: formatFormNo(PREFIXES.abnormalReport, next),
    workCoop: formatFormNo(PREFIXES.workCoop, next),
    suggestion: formatFormNo(PREFIXES.suggestion, next),
  };
}

export async function allocateFormNo(
  prefix: string,
  client: DbClient = prisma
): Promise<string> {
  const next = await allocateNextGlobalIndex(client);
  return formatFormNo(prefix, next);
}

export async function getNextComplaintFormNo(
  client: DbClient = prisma
): Promise<string> {
  return allocateFormNo(PREFIXES.complaint, client);
}

export async function getNextQualityImprovementFormNo(
  client: DbClient = prisma
): Promise<string> {
  return allocateFormNo(PREFIXES.qualityImprovement, client);
}

export async function getNextAbnormalReportFormNo(
  client: DbClient = prisma
): Promise<string> {
  return allocateFormNo(PREFIXES.abnormalReport, client);
}

export async function getNextWorkCoopFormNo(
  client: DbClient = prisma
): Promise<string> {
  return allocateFormNo(PREFIXES.workCoop, client);
}

export async function getNextSuggestionFormNo(
  client: DbClient = prisma
): Promise<string> {
  return allocateFormNo(PREFIXES.suggestion, client);
}
