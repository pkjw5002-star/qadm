import type { FormType } from "@/generated/prisma/client";
import type { FormListRow } from "@/app/forms/formListTableTypes";

export const LIST_SNAPSHOT_VERSION = 1;

export type StoredListSnapshot =
  | {
      v: typeof LIST_SNAPSHOT_VERSION;
      kind: "COMPLAINT";
      cells: Record<string, string>;
      cellHref: Partial<Record<string, string>>;
      highlightPending: boolean;
      filterNotRecovered: boolean;
      filterRecoveredIncomplete: boolean;
    }
  | {
      v: typeof LIST_SNAPSHOT_VERSION;
      kind: "REVIEW_FILTER";
      cells: Record<string, string>;
      highlightPending: boolean;
      includeWhenFiltered: boolean;
    };

export function formatListDate(raw: unknown): string {
  if (raw === undefined || raw === null) return "—";
  const s = String(raw).trim();
  if (s === "") return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(`${s}T12:00:00`)
    : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function complaintListDateMissing(raw: unknown): boolean {
  if (raw === undefined || raw === null) return true;
  return String(raw).trim() === "";
}

function textOrDash(v: unknown): string {
  if (v === undefined || v === null) return "—";
  const s = String(v).trim();
  return s !== "" ? s : "—";
}

function outsideAsDateSlashExecutor(
  dateRaw: unknown,
  executorRaw: unknown
): string {
  const dateLabel = formatListDate(dateRaw);
  const execLabel =
    executorRaw != null && String(executorRaw).trim() !== ""
      ? String(executorRaw).trim()
      : "—";
  if (dateLabel === "—" && execLabel === "—") return "—";
  return `${dateLabel}/${execLabel}`;
}

function defectPhenomenonText(
  prod:
    | {
        recoveredOperationAndAppearanceDefect?: unknown;
        recoveredOperation?: unknown;
        appearanceDefectPhenomenon?: unknown;
      }
    | undefined
): string {
  if (!prod) return "—";
  const merged = prod.recoveredOperationAndAppearanceDefect;
  if (
    merged !== undefined &&
    merged !== null &&
    String(merged).trim() !== ""
  ) {
    return String(merged);
  }
  const legacyOp = prod.recoveredOperation;
  const legacyAp = prod.appearanceDefectPhenomenon;
  const parts = [legacyOp, legacyAp]
    .filter(
      (x) => x !== undefined && x !== null && String(x).trim() !== ""
    )
    .map(String);
  return parts.length > 0 ? parts.join("\n") : "—";
}

function recoveryHandlingSummaryText(r?: {
  processingContent?: unknown;
  processingDetail?: unknown;
}): string {
  if (!r) return "—";
  const c =
    r.processingContent != null && String(r.processingContent).trim() !== ""
      ? String(r.processingContent)
      : "";
  const d =
    r.processingDetail != null && String(r.processingDetail).trim() !== ""
      ? String(r.processingDetail)
      : "";
  if (!c && !d) return "—";
  if (c && d) return `${c} / ${d}`;
  return c || d;
}

function prodLabCombinedField(prodVal: unknown, labVal: unknown): string {
  const p =
    prodVal != null && String(prodVal).trim() !== ""
      ? String(prodVal).trim()
      : "";
  const l =
    labVal != null && String(labVal).trim() !== ""
      ? String(labVal).trim()
      : "";
  if (!p && !l) return "—";
  if (p && l) return `${p}\n${l}`;
  return p || l;
}

function complaintListRow(data: unknown, title: string) {
  const root = data as {
    summary?: unknown;
    complaint?: {
      formNo?: unknown;
      receipt?: {
        date?: unknown;
        complaintProductName?: unknown;
        departmentAndOwner?: unknown;
        customerInfo?: unknown;
        productAndComplaint?: unknown;
        actionContent?: unknown;
      };
      outsideAs?: {
        date?: unknown;
        executor?: unknown;
        contentAndResult?: unknown;
        duration?: unknown;
      };
      productionHandlingReport?: {
        defectiveProductRecoveryDate?: unknown;
        causeAnalysisDate?: unknown;
        recoveredOperationAndAppearanceDefect?: unknown;
        recoveredOperation?: unknown;
        appearanceDefectPhenomenon?: unknown;
        defectCauseAnalysis?: unknown;
        recurrencePreventionMeasures?: unknown;
      };
      researchLabHandlingReport?: {
        causeAnalysis?: unknown;
        recurrencePreventionMeasures?: unknown;
      };
      recoveredProductHandling?: {
        processingDate?: unknown;
        processingContent?: unknown;
        processingDetail?: unknown;
      };
    };
  };
  const c = root.complaint;
  const r = c?.receipt;
  const o = c?.outsideAs;
  const prod = c?.productionHandlingReport;
  const lab = c?.researchLabHandlingReport;
  const recv = c?.recoveredProductHandling;

  const formNo =
    c?.formNo != null && String(c.formNo).trim() !== ""
      ? String(c.formNo)
      : title;

  const content =
    r?.productAndComplaint != null &&
    String(r.productAndComplaint).trim() !== ""
      ? String(r.productAndComplaint)
      : root.summary != null && String(root.summary).trim() !== ""
        ? String(root.summary)
        : "—";

  const actionContent =
    r?.actionContent != null && String(r.actionContent).trim() !== ""
      ? String(r.actionContent)
      : "—";

  return {
    no: formNo,
    receiptDate: r?.date,
    customerInfo: textOrDash(r?.customerInfo),
    productName: r?.complaintProductName,
    departmentAndOwner: r?.departmentAndOwner,
    content,
    actionContent,
    outsideAsDateAndExecutor: outsideAsDateSlashExecutor(o?.date, o?.executor),
    outsideAsContent:
      o?.contentAndResult != null &&
      String(o.contentAndResult).trim() !== ""
        ? String(o.contentAndResult)
        : "—",
    outsideAsTime: textOrDash(o?.duration),
    recoveryDate: prod?.defectiveProductRecoveryDate,
    causeAnalysisDate: prod?.causeAnalysisDate,
    defectPhenomenon: defectPhenomenonText(prod),
    defectCauseAnalysis: prodLabCombinedField(
      prod?.defectCauseAnalysis,
      lab?.causeAnalysis
    ),
    recurrencePrevention: prodLabCombinedField(
      prod?.recurrencePreventionMeasures,
      lab?.recurrencePreventionMeasures
    ),
    recoveryHandlingContent: recoveryHandlingSummaryText(recv),
  };
}

function listAuthorFromFormJson(
  data: unknown,
  kind:
    | "QUALITY_IMPROVEMENT"
    | "ABNORMAL_REPORT"
    | "WORK_COOP"
    | "SUGGESTION",
  accountName: string
): string {
  const root = data as {
    qualityImprovement?: { receipt?: { writerName?: unknown } };
    abnormalReport?: { report?: { writerName?: unknown } };
    workCoop?: { report?: { writerName?: unknown } };
    suggestion?: { proposal?: { writerName?: unknown } };
  };
  let raw: unknown;
  switch (kind) {
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

type AbLikeJson = {
  formNo?: unknown;
  report?: {
    date?: unknown;
    itemSpec?: unknown;
    problemAndRequest?: unknown;
    handlingDepartmentOwner?: unknown;
  };
  handlingReport?: {
    date?: unknown;
    plannedDateReason?: unknown;
    causeAndActionPrevention?: unknown;
  };
  reporterConfirm?: { date?: unknown; content?: unknown };
};

function abLikeListRow(
  data: unknown,
  title: string,
  branch: "ABNORMAL_REPORT" | "WORK_COOP"
) {
  const root = data as {
    abnormalReport?: AbLikeJson;
    workCoop?: AbLikeJson;
  };
  const b =
    branch === "ABNORMAL_REPORT" ? root.abnormalReport : root.workCoop;
  const r = b?.report;
  const h = b?.handlingReport;
  const c = b?.reporterConfirm;

  const formNo =
    b?.formNo != null && String(b.formNo).trim() !== ""
      ? String(b.formNo)
      : title;

  return {
    no: formNo,
    reportDate: r?.date,
    itemSpec: textOrDash(r?.itemSpec),
    problemAndRequest: textOrDash(r?.problemAndRequest),
    handlingDeptOwner: textOrDash(r?.handlingDepartmentOwner),
    handlingDate: h?.date,
    handlingPlannedDateReason: h?.plannedDateReason,
    causeAndAction: textOrDash(h?.causeAndActionPrevention),
    reporterConfirmContent: textOrDash(c?.content),
  };
}

function suggestionListRow(data: unknown, title: string) {
  const root = data as {
    suggestion?: {
      formNo?: unknown;
      proposal?: {
        date?: unknown;
        content?: unknown;
        effect?: unknown;
      };
      reviewResult?: {
        reviewDate?: unknown;
        reviewerCommentLine?: unknown;
        processingHandler?: unknown;
        processingPlannedDate?: unknown;
        processingContent?: unknown;
      };
    };
  };
  const sg = root.suggestion;
  const p = sg?.proposal;
  const rr = sg?.reviewResult;

  const formNo =
    sg?.formNo != null && String(sg.formNo).trim() !== ""
      ? String(sg.formNo)
      : title;

  return {
    no: formNo,
    proposalDate: p?.date,
    proposalContent: textOrDash(p?.content),
    proposalEffect: textOrDash(p?.effect),
    reviewDate: rr?.reviewDate,
    reviewerComment: textOrDash(rr?.reviewerCommentLine),
    processingHandler: textOrDash(rr?.processingHandler),
    processingPlannedDate: rr?.processingPlannedDate,
    processingContent: textOrDash(rr?.processingContent),
  };
}

function qualityImprovementListRow(data: unknown, title: string) {
  const root = data as {
    qualityImprovement?: {
      formNo?: unknown;
      receipt?: {
        itemSpec?: unknown;
        requestReasonDetails?: unknown;
        reviewDepartmentOwner?: unknown;
      };
      review?: {
        date?: unknown;
        improvementContent?: unknown;
      };
      requesterConfirm?: { content?: unknown };
    };
  };
  const qi = root.qualityImprovement;
  const r = qi?.receipt;
  const v = qi?.review;
  const conf = qi?.requesterConfirm;

  const formNo =
    qi?.formNo != null && String(qi.formNo).trim() !== ""
      ? String(qi.formNo)
      : title;

  return {
    no: formNo,
    itemSpec: textOrDash(r?.itemSpec),
    requestReason: textOrDash(r?.requestReasonDetails),
    reviewDeptOwner: textOrDash(r?.reviewDepartmentOwner),
    reviewDate: v?.date,
    improvementContent: textOrDash(v?.improvementContent),
    requesterConfirmContent: textOrDash(conf?.content),
  };
}

function parseStoredSnapshot(raw: unknown): StoredListSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as StoredListSnapshot;
  if (o.v !== LIST_SNAPSHOT_VERSION) return null;
  if (o.kind === "COMPLAINT" && o.cells) return o;
  if (o.kind === "REVIEW_FILTER" && o.cells) return o;
  return null;
}

export function buildListSnapshot(params: {
  type: FormType;
  data: unknown;
  title: string;
  authorName: string;
  createdAt: Date;
}): StoredListSnapshot | null {
  const { type, data, title, authorName, createdAt } = params;

  if (type === "COMPLAINT") {
    const row = complaintListRow(data, title);
    const productLabel =
      row.productName != null && String(row.productName).trim() !== ""
        ? String(row.productName)
        : "—";
    const deptLabel =
      row.departmentAndOwner != null &&
      String(row.departmentAndOwner).trim() !== ""
        ? String(row.departmentAndOwner)
        : "—";
    const missingRecoveryDate = complaintListDateMissing(row.recoveryDate);
    const recoveredWithoutCauseAnalysisDate =
      !missingRecoveryDate && complaintListDateMissing(row.causeAnalysisDate);
    const highlightPending = complaintListDateMissing(row.causeAnalysisDate);
    const no = String(row.no).trim() !== "" ? String(row.no) : "—";

    return {
      v: LIST_SNAPSHOT_VERSION,
      kind: "COMPLAINT",
      cells: {
        no,
        receiptDate: formatListDate(row.receiptDate),
        customerInfo: row.customerInfo,
        productName: productLabel,
        departmentOwner: deptLabel,
        content: row.content,
        actionContent: row.actionContent,
        outsideAsMeta: row.outsideAsDateAndExecutor,
        outsideAsContent: row.outsideAsContent,
        outsideAsTime: row.outsideAsTime,
        recoveryDate: formatListDate(row.recoveryDate),
        causeAnalysisDate: formatListDate(row.causeAnalysisDate),
        defectPhenomenon: row.defectPhenomenon,
        defectCauseAnalysis: row.defectCauseAnalysis,
        recurrencePrevention: row.recurrencePrevention,
        recoveryHandling: row.recoveryHandlingContent,
      },
      cellHref: {
        defectPhenomenon: "complaint-prod-defect",
        defectCauseAnalysis: "complaint-prod-cause",
      },
      highlightPending,
      filterNotRecovered: missingRecoveryDate,
      filterRecoveredIncomplete: recoveredWithoutCauseAnalysisDate,
    };
  }

  if (type === "QUALITY_IMPROVEMENT") {
    const authorLabel = listAuthorFromFormJson(
      data,
      "QUALITY_IMPROVEMENT",
      authorName
    );
    const row = qualityImprovementListRow(data, title);
    const includeWhenFiltered = complaintListDateMissing(row.reviewDate);
    return {
      v: LIST_SNAPSHOT_VERSION,
      kind: "REVIEW_FILTER",
      cells: {
        no: String(row.no),
        createdAt: formatListDate(createdAt),
        author: authorLabel,
        itemSpec: row.itemSpec,
        requestReason: row.requestReason,
        reviewDeptOwner: row.reviewDeptOwner,
        reviewDate: formatListDate(row.reviewDate),
        improvementContent: row.improvementContent,
        requesterConfirm: row.requesterConfirmContent,
      },
      highlightPending: includeWhenFiltered,
      includeWhenFiltered,
    };
  }

  if (type === "ABNORMAL_REPORT") {
    const authorLabel = listAuthorFromFormJson(
      data,
      "ABNORMAL_REPORT",
      authorName
    );
    const row = abLikeListRow(data, title, "ABNORMAL_REPORT");
    const includeWhenFiltered = complaintListDateMissing(row.handlingDate);
    return {
      v: LIST_SNAPSHOT_VERSION,
      kind: "REVIEW_FILTER",
      cells: {
        no: String(row.no),
        author: authorLabel,
        reportDate: formatListDate(row.reportDate),
        itemSpec: row.itemSpec,
        problemAndRequest: row.problemAndRequest,
        handlingDeptOwner: row.handlingDeptOwner,
        handlingDate: formatListDate(row.handlingDate),
        causeAndAction: row.causeAndAction,
        reporterConfirm: row.reporterConfirmContent,
      },
      highlightPending: includeWhenFiltered,
      includeWhenFiltered,
    };
  }

  if (type === "WORK_COOP") {
    const authorLabel = listAuthorFromFormJson(data, "WORK_COOP", authorName);
    const row = abLikeListRow(data, title, "WORK_COOP");
    const includeWhenFiltered =
      complaintListDateMissing(row.handlingDate) ||
      complaintListDateMissing(row.handlingPlannedDateReason);
    return {
      v: LIST_SNAPSHOT_VERSION,
      kind: "REVIEW_FILTER",
      cells: {
        no: String(row.no),
        author: authorLabel,
        reportDate: formatListDate(row.reportDate),
        itemSpec: row.itemSpec,
        problemAndRequest: row.problemAndRequest,
        handlingDeptOwner: row.handlingDeptOwner,
        handlingDate: formatListDate(row.handlingDate),
        causeAndAction: row.causeAndAction,
        reporterConfirm: row.reporterConfirmContent,
      },
      highlightPending: includeWhenFiltered,
      includeWhenFiltered,
    };
  }

  if (type === "SUGGESTION") {
    const authorLabel = listAuthorFromFormJson(data, "SUGGESTION", authorName);
    const row = suggestionListRow(data, title);
    const includeWhenFiltered = complaintListDateMissing(
      row.processingPlannedDate
    );
    return {
      v: LIST_SNAPSHOT_VERSION,
      kind: "REVIEW_FILTER",
      cells: {
        no: String(row.no),
        createdAt: formatListDate(row.proposalDate),
        author: authorLabel,
        proposalContent: row.proposalContent,
        proposalEffect: row.proposalEffect,
        reviewDate: formatListDate(row.reviewDate),
        reviewerComment: row.reviewerComment,
        processingHandler: row.processingHandler,
        processingPlannedDate: formatListDate(row.processingPlannedDate),
        processingContent: row.processingContent,
      },
      highlightPending: includeWhenFiltered,
      includeWhenFiltered,
    };
  }

  return null;
}

function expectedSnapshotKind(type: FormType): StoredListSnapshot["kind"] {
  return type === "COMPLAINT" ? "COMPLAINT" : "REVIEW_FILTER";
}

export function isStoredListSnapshotValid(
  type: FormType,
  listSnapshot: unknown
): boolean {
  const parsed = parseStoredSnapshot(listSnapshot);
  if (!parsed) return false;
  return parsed.kind === expectedSnapshotKind(type);
}

export function resolveListSnapshot(
  params: {
    type: FormType;
    data: unknown;
    title: string;
    authorName: string;
    createdAt: Date;
    listSnapshot: unknown;
  }
): StoredListSnapshot | null {
  const expected = expectedSnapshotKind(params.type);
  const parsed = parseStoredSnapshot(params.listSnapshot);
  if (parsed && parsed.kind === expected) return parsed;
  return buildListSnapshot(params);
}

export function complaintRowFromSnapshot(
  formId: string,
  snap: Extract<StoredListSnapshot, { kind: "COMPLAINT" }>,
  comment?: { line: string | null; tooltip: string | null }
): FormListRow {
  const cellHref: Partial<Record<string, string>> = {};
  for (const [key, anchor] of Object.entries(snap.cellHref)) {
    cellHref[key] = `/forms/${formId}/edit#${anchor}`;
  }
  return {
    id: formId,
    cells: snap.cells,
    cellHref,
    commentLine: comment?.line ?? null,
    commentTooltip: comment?.tooltip ?? null,
    highlightPending: snap.highlightPending,
    filterNotRecovered: snap.filterNotRecovered,
    filterRecoveredIncomplete: snap.filterRecoveredIncomplete,
  };
}

export function reviewFilterRowFromSnapshot(
  formId: string,
  snap: Extract<StoredListSnapshot, { kind: "REVIEW_FILTER" }>,
  comment?: { line: string | null; tooltip: string | null }
): { listRow: FormListRow; includeWhenFiltered: boolean } {
  return {
    includeWhenFiltered: snap.includeWhenFiltered,
    listRow: {
      id: formId,
      cells: snap.cells,
      commentLine: comment?.line ?? null,
      commentTooltip: comment?.tooltip ?? null,
      highlightPending: snap.highlightPending,
    },
  };
}
