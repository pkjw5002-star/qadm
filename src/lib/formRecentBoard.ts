import type { FormType } from "@/generated/prisma/client";
import { FORM_TYPE_LABEL, type FormTypeKey } from "@/lib/formTypes";
import { formatListDate } from "@/lib/formListSnapshot";

export type RecentBoardRow = {
  id: string;
  no: string;
  docDate: string;
  /** YYYY-MM-DD or empty — 검색용 */
  docDateRaw: string;
  formType: FormTypeKey;
  formTypeLabel: string;
  author: string;
  /** 서류별 처리자(부서/담당자 등) — 검색용 */
  handler: string;
  productCategory: string;
  productName: string;
  content: string;
  causeAnalysis: string;
  handlingContent: string;
};

function textOrEmpty(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  return s !== "" && s !== "—" ? s : "";
}

function dateRaw(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return "";
    const y = v.getFullYear();
    const mo = String(v.getMonth() + 1).padStart(2, "0");
    const day = String(v.getDate()).padStart(2, "0");
    return `${y}-${mo}-${day}`;
  }
  const s = String(v).trim();
  if (s === "") return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dotted = s.match(/^(\d{4})[./](\d{1,2})[./](\d{1,2})/);
  if (dotted) {
    return `${dotted[1]}-${dotted[2].padStart(2, "0")}-${dotted[3].padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

function authorFromJson(
  data: unknown,
  type: FormType,
  accountName: string
): string {
  const root = data as {
    qualityImprovement?: { receipt?: { writerName?: unknown } };
    abnormalReport?: { report?: { writerName?: unknown } };
    workCoop?: { report?: { writerName?: unknown } };
    suggestion?: { proposal?: { writerName?: unknown } };
  };
  let raw: unknown;
  switch (type) {
    case "QUALITY_IMPROVEMENT":
      raw = root.qualityImprovement?.receipt?.writerName;
      break;
    case "ABNORMAL_REPORT":
      raw = root.abnormalReport?.report?.writerName;
      break;
    case "WORK_COOP":
      raw = root.workCoop?.report?.writerName;
      break;
    case "SUGGESTION":
      raw = root.suggestion?.proposal?.writerName;
      break;
    default:
      raw = undefined;
  }
  if (raw !== undefined && raw !== null && String(raw).trim() !== "") {
    return String(raw).trim();
  }
  return accountName;
}

function combinedCause(prod?: unknown, lab?: unknown): string {
  const p = textOrEmpty(prod);
  const l = textOrEmpty(lab);
  if (p && l) return `${p}\n${l}`;
  return p || l;
}

function formNoFromData(data: unknown, title: string, branch: string): string {
  const root = data as Record<string, { formNo?: unknown } | undefined>;
  const no = root[branch]?.formNo;
  if (no != null && String(no).trim() !== "") return String(no).trim();
  return title.trim() !== "" ? title : "—";
}

export function buildRecentBoardRow(params: {
  id: string;
  type: FormType;
  title: string;
  data: unknown;
  authorName: string;
  createdAt: Date;
}): RecentBoardRow | null {
  const { id, type, title, data, authorName, createdAt } = params;
  if (!(type in FORM_TYPE_LABEL)) return null;
  const formType = type as FormTypeKey;
  const formTypeLabel = FORM_TYPE_LABEL[formType];
  const author =
    type === "COMPLAINT" ? authorName : authorFromJson(data, type, authorName);

  if (type === "COMPLAINT") {
    const root = data as {
      summary?: unknown;
      complaint?: {
        receipt?: {
          date?: unknown;
          productCategory?: unknown;
          complaintProductName?: unknown;
          departmentAndOwner?: unknown;
          productAndComplaint?: unknown;
          actionContent?: unknown;
        };
        productionHandlingReport?: { defectCauseAnalysis?: unknown };
        researchLabHandlingReport?: { causeAnalysis?: unknown };
      };
    };
    const r = root.complaint?.receipt;
    const prod = root.complaint?.productionHandlingReport;
    const lab = root.complaint?.researchLabHandlingReport;
    const rawDate = dateRaw(r?.date) || dateRaw(createdAt);
    const content =
      textOrEmpty(r?.productAndComplaint) || textOrEmpty(root.summary);
    return {
      id,
      no: formNoFromData(data, title, "complaint"),
      docDate: formatListDate(r?.date ?? createdAt),
      docDateRaw: rawDate,
      formType,
      formTypeLabel,
      author,
      handler: textOrEmpty(r?.departmentAndOwner),
      productCategory: textOrEmpty(r?.productCategory),
      productName: textOrEmpty(r?.complaintProductName) || "—",
      content: content || "—",
      causeAnalysis:
        combinedCause(prod?.defectCauseAnalysis, lab?.causeAnalysis) || "—",
      handlingContent: textOrEmpty(r?.actionContent) || "—",
    };
  }

  if (type === "QUALITY_IMPROVEMENT") {
    const root = data as {
      qualityImprovement?: {
        receipt?: {
          date?: unknown;
          productCategory?: unknown;
          itemSpec?: unknown;
          requestReasonDetails?: unknown;
          reviewDepartmentOwner?: unknown;
        };
        review?: { improvementContent?: unknown };
      };
    };
    const qi = root.qualityImprovement;
    const r = qi?.receipt;
    const v = qi?.review;
    const rawDate = dateRaw(r?.date) || dateRaw(createdAt);
    return {
      id,
      no: formNoFromData(data, title, "qualityImprovement"),
      docDate: formatListDate(r?.date ?? createdAt),
      docDateRaw: rawDate,
      formType,
      formTypeLabel,
      author,
      handler: textOrEmpty(r?.reviewDepartmentOwner),
      productCategory: textOrEmpty(r?.productCategory),
      productName: textOrEmpty(r?.itemSpec) || "—",
      content: textOrEmpty(r?.requestReasonDetails) || "—",
      causeAnalysis: "—",
      handlingContent: textOrEmpty(v?.improvementContent) || "—",
    };
  }

  if (type === "ABNORMAL_REPORT" || type === "WORK_COOP") {
    const branch = type === "ABNORMAL_REPORT" ? "abnormalReport" : "workCoop";
    const root = data as {
      abnormalReport?: {
        report?: {
          date?: unknown;
          productCategory?: unknown;
          itemSpec?: unknown;
          problemAndRequest?: unknown;
          handlingDepartmentOwner?: unknown;
        };
        handlingReport?: { causeAndActionPrevention?: unknown };
      };
      workCoop?: {
        report?: {
          date?: unknown;
          productCategory?: unknown;
          itemSpec?: unknown;
          problemAndRequest?: unknown;
          handlingDepartmentOwner?: unknown;
        };
        handlingReport?: { causeAndActionPrevention?: unknown };
      };
    };
    const b = root[branch];
    const r = b?.report;
    const h = b?.handlingReport;
    const rawDate = dateRaw(r?.date) || dateRaw(createdAt);
    return {
      id,
      no: formNoFromData(data, title, branch),
      docDate: formatListDate(r?.date ?? createdAt),
      docDateRaw: rawDate,
      formType,
      formTypeLabel,
      author,
      handler: textOrEmpty(r?.handlingDepartmentOwner),
      productCategory: textOrEmpty(r?.productCategory),
      productName: textOrEmpty(r?.itemSpec) || "—",
      content: textOrEmpty(r?.problemAndRequest) || "—",
      causeAnalysis: "—",
      handlingContent: textOrEmpty(h?.causeAndActionPrevention) || "—",
    };
  }

  if (type === "SUGGESTION") {
    const root = data as {
      suggestion?: {
        proposal?: { date?: unknown; content?: unknown };
        reviewResult?: {
          processingContent?: unknown;
          processingHandler?: unknown;
        };
      };
    };
    const p = root.suggestion?.proposal;
    const rr = root.suggestion?.reviewResult;
    const rawDate = dateRaw(p?.date) || dateRaw(createdAt);
    return {
      id,
      no: formNoFromData(data, title, "suggestion"),
      docDate: formatListDate(p?.date ?? createdAt),
      docDateRaw: rawDate,
      formType,
      formTypeLabel,
      author,
      handler: textOrEmpty(rr?.processingHandler),
      productCategory: "",
      productName: "—",
      content: textOrEmpty(p?.content) || "—",
      causeAnalysis: "—",
      handlingContent: textOrEmpty(rr?.processingContent) || "—",
    };
  }

  return null;
}
