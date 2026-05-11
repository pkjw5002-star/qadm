import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FORM_TYPE_LABEL, isFormTypeKey, type FormTypeKey } from "@/lib/formTypes";
import ComplaintFormsTable, {
  type ComplaintListRowVm,
} from "@/app/forms/ComplaintFormsTable";
import ReviewProcessFilterFormsTable, {
  type ReviewProcessFilterRow,
} from "@/app/forms/ReviewProcessFilterFormsTable";
import {
  QUALITY_IMPROVEMENT_LIST_COLUMNS,
  QUALITY_IMPROVEMENT_LIST_STORAGE_KEY,
  ABNORMAL_REPORT_LIST_COLUMNS,
  ABNORMAL_REPORT_LIST_STORAGE_KEY,
  WORK_COOP_LIST_COLUMNS,
  WORK_COOP_LIST_STORAGE_KEY,
  SUGGESTION_LIST_COLUMNS,
  SUGGESTION_LIST_STORAGE_KEY,
} from "@/app/forms/formListTablePresets";

const statusLabel: Record<string, string> = {
  DRAFT: "작성중",
  SUBMITTED: "제출",
  IN_REVIEW: "검토중",
  APPROVED: "승인",
  REJECTED: "반려",
  CLOSED: "종료",
};

function formatListDate(raw: unknown): string {
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

/** 불만 목록: 회수일·원인분석일 등 공란 여부(원본 JSON 값 기준) */
function complaintListDateMissing(raw: unknown): boolean {
  if (raw === undefined || raw === null) return true;
  return String(raw).trim() === "";
}

/** 사외AS 목록 셀: `일자/실시자` (없으면 해당쪽 —) */
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

/** 생산·연구소 처리보고서 동일 성격 필드를 본문만 이어 붙임 (한 줄만 바꿈, 빈 줄 없음) */
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
    /** 열 헤더는 「사외AS시간」, 값은 소요시간(duration) */
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

function textOrDash(v: unknown): string {
  if (v === undefined || v === null) return "—";
  const s = String(v).trim();
  return s !== "" ? s : "—";
}

/** 목록 «작성자»: 서식 JSON의 작성자 필드 우선, 없으면 계정명 */
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

function commentPayloadText(payload: unknown): string {
  const p = payload as { text?: unknown } | null;
  const text = p?.text != null ? String(p.text).trim() : "";
  return text;
}

type LatestComment = {
  payload: unknown;
  createdAt: Date;
  actor: { name: string };
};

/** 상세 페이지 댓글과 동일하게 COMMENT 이벤트 기준 미리보기 문구 */
function getCommentPreview(
  latest: LatestComment | undefined,
  totalCount: number
): { line: string; tooltip: string } | null {
  if (totalCount === 0 || !latest) return null;
  const body = commentPayloadText(latest.payload);
  const actor = latest.actor.name;
  const when = new Date(latest.createdAt).toLocaleString();
  const suffix = totalCount > 1 ? ` · ${totalCount}건` : "";
  const line = body
    ? `${actor}: ${body}${suffix}`
    : `${actor}${suffix}`;
  const tooltip = [
    totalCount > 1 ? `총 ${totalCount}건 (최신 기준)` : "최신 댓글",
    `${actor} · ${when}`,
    "",
    body || "(내용 없음)",
  ].join("\n");
  return { line, tooltip };
}

export default async function FormsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const type: FormTypeKey | undefined = isFormTypeKey(sp.type)
    ? sp.type
    : undefined;
  const isComplaintList = type === "COMPLAINT";
  const isQualityImprovementList = type === "QUALITY_IMPROVEMENT";
  const isAbnormalList = type === "ABNORMAL_REPORT";
  const isWorkCoopList = type === "WORK_COOP";
  const isSuggestionList = type === "SUGGESTION";

  const listPageTitle =
    type !== undefined ? FORM_TYPE_LABEL[type] : "서식 목록";

  const loadFormDataJson =
    isComplaintList ||
    isQualityImprovementList ||
    isAbnormalList ||
    isWorkCoopList ||
    isSuggestionList;

  const forms = await prisma.form.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      data: loadFormDataJson,
      createdAt: true,
      createdBy: { select: { name: true } },
      events: {
        where: { action: "COMMENT" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          payload: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      },
    },
  });

  const commentCountMap = new Map<string, number>();
  if (forms.length > 0) {
    const ids = forms.map((f) => f.id);
    const commentRows = await prisma.formEvent.findMany({
      where: {
        formId: { in: ids },
        action: "COMMENT",
      },
      select: { formId: true },
    });
    for (const r of commentRows) {
      commentCountMap.set(
        r.formId,
        (commentCountMap.get(r.formId) ?? 0) + 1
      );
    }
  }

  const complaintRows: ComplaintListRowVm[] = isComplaintList
    ? forms.map((f) => {
        const row = complaintListRow(f.data, f.title);
        const productLabel =
          row.productName != null && String(row.productName).trim() !== ""
            ? String(row.productName)
            : "—";
        const deptLabel =
          row.departmentAndOwner != null &&
          String(row.departmentAndOwner).trim() !== ""
            ? String(row.departmentAndOwner)
            : "—";
        const preview = getCommentPreview(
          f.events[0],
          commentCountMap.get(f.id) ?? 0
        );
        const missingRecoveryDate = complaintListDateMissing(
          row.recoveryDate
        );
        const recoveredWithoutCauseAnalysisDate =
          !missingRecoveryDate &&
          complaintListDateMissing(row.causeAnalysisDate);
        return {
          id: f.id,
          no: String(row.no),
          receiptDate: formatListDate(row.receiptDate),
          customerInfo: row.customerInfo,
          productName: productLabel,
          departmentAndOwner: deptLabel,
          content: row.content,
          actionContent: row.actionContent,
          outsideAsDateAndExecutor: row.outsideAsDateAndExecutor,
          outsideAsContent: row.outsideAsContent,
          outsideAsTime: row.outsideAsTime,
          recoveryDate: formatListDate(row.recoveryDate),
          causeAnalysisDate: formatListDate(row.causeAnalysisDate),
          missingRecoveryDate,
          recoveredWithoutCauseAnalysisDate,
          defectPhenomenon: row.defectPhenomenon,
          defectCauseAnalysis: row.defectCauseAnalysis,
          recurrencePrevention: row.recurrencePrevention,
          recoveryHandlingContent: row.recoveryHandlingContent,
          commentLine: preview?.line ?? null,
          commentTooltip: preview?.tooltip ?? null,
        };
      })
    : [];

  const qualityRows: ReviewProcessFilterRow[] = isQualityImprovementList
    ? forms.map((f) => {
        const authorLabel = listAuthorFromFormJson(
          f.data,
          "QUALITY_IMPROVEMENT",
          f.createdBy.name
        );
        const row = qualityImprovementListRow(f.data, f.title);
        const preview = getCommentPreview(
          f.events[0],
          commentCountMap.get(f.id) ?? 0
        );
        const includeWhenFiltered = complaintListDateMissing(row.reviewDate);
        return {
          includeWhenFiltered,
          listRow: {
            id: f.id,
            cells: {
              no: String(row.no),
              createdAt: formatListDate(f.createdAt),
              author: authorLabel,
              itemSpec: row.itemSpec,
              requestReason: row.requestReason,
              reviewDeptOwner: row.reviewDeptOwner,
              reviewDate: formatListDate(row.reviewDate),
              improvementContent: row.improvementContent,
              requesterConfirm: row.requesterConfirmContent,
            },
            commentLine: preview?.line ?? null,
            commentTooltip: preview?.tooltip ?? null,
          },
        };
      })
    : [];

  const abnormalRows: ReviewProcessFilterRow[] = isAbnormalList
    ? forms.map((f) => {
        const authorLabel = listAuthorFromFormJson(
          f.data,
          "ABNORMAL_REPORT",
          f.createdBy.name
        );
        const row = abLikeListRow(f.data, f.title, "ABNORMAL_REPORT");
        const preview = getCommentPreview(
          f.events[0],
          commentCountMap.get(f.id) ?? 0
        );
        const includeWhenFiltered = complaintListDateMissing(row.handlingDate);
        return {
          includeWhenFiltered,
          listRow: {
            id: f.id,
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
            commentLine: preview?.line ?? null,
            commentTooltip: preview?.tooltip ?? null,
          },
        };
      })
    : [];

  const workCoopRows: ReviewProcessFilterRow[] = isWorkCoopList
    ? forms.map((f) => {
        const authorLabel = listAuthorFromFormJson(
          f.data,
          "WORK_COOP",
          f.createdBy.name
        );
        const row = abLikeListRow(f.data, f.title, "WORK_COOP");
        const preview = getCommentPreview(
          f.events[0],
          commentCountMap.get(f.id) ?? 0
        );
        const includeWhenFiltered = complaintListDateMissing(row.handlingDate);
        return {
          includeWhenFiltered,
          listRow: {
            id: f.id,
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
            commentLine: preview?.line ?? null,
            commentTooltip: preview?.tooltip ?? null,
          },
        };
      })
    : [];

  const suggestionRows: ReviewProcessFilterRow[] = isSuggestionList
    ? forms.map((f) => {
        const authorLabel = listAuthorFromFormJson(
          f.data,
          "SUGGESTION",
          f.createdBy.name
        );
        const row = suggestionListRow(f.data, f.title);
        const preview = getCommentPreview(
          f.events[0],
          commentCountMap.get(f.id) ?? 0
        );
        const includeWhenFiltered = complaintListDateMissing(
          row.processingPlannedDate
        );
        return {
          includeWhenFiltered,
          listRow: {
            id: f.id,
            cells: {
              no: String(row.no),
              // 제안서: 입력 화면의 "작성일자"를 목록의 "작성일자"로 표시
              createdAt: formatListDate(row.proposalDate),
              author: authorLabel,
              proposalContent: row.proposalContent,
              proposalEffect: row.proposalEffect,
              reviewDate: formatListDate(row.reviewDate),
              reviewerComment: row.reviewerComment,
              processingPlannedDate: formatListDate(
                row.processingPlannedDate
              ),
              processingContent: row.processingContent,
            },
            commentLine: preview?.line ?? null,
            commentTooltip: preview?.tooltip ?? null,
          },
        };
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            {listPageTitle}
          </h1>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {!isComplaintList &&
        !isQualityImprovementList &&
        !isAbnormalList &&
        !isWorkCoopList &&
        !isSuggestionList ? (
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
          <div className="col-span-2">종류</div>
            <div className="col-span-3">제목</div>
          <div className="col-span-2">상태</div>
          <div className="col-span-2">작성자</div>
            <div className="col-span-2">댓글</div>
          <div className="col-span-1 text-right">일자</div>
        </div>
        ) : null}

        {forms.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-600">
            아직 서식이 없어요. 우측 상단에서 서류작성을 눌러 보세요.
          </div>
        ) : isComplaintList ? (
          <ComplaintFormsTable rows={complaintRows} />
        ) : isQualityImprovementList ? (
          <ReviewProcessFilterFormsTable
            storageKey={QUALITY_IMPROVEMENT_LIST_STORAGE_KEY}
            columns={QUALITY_IMPROVEMENT_LIST_COLUMNS}
            rows={qualityRows}
            filterTitle="미검토"
            filterHint="(검토일자 없음)"
          />
        ) : isAbnormalList ? (
          <ReviewProcessFilterFormsTable
            storageKey={ABNORMAL_REPORT_LIST_STORAGE_KEY}
            columns={ABNORMAL_REPORT_LIST_COLUMNS}
            rows={abnormalRows}
            filterTitle="미처리"
            filterHint="(처리일자 없음)"
          />
        ) : isWorkCoopList ? (
          <ReviewProcessFilterFormsTable
            storageKey={WORK_COOP_LIST_STORAGE_KEY}
            columns={WORK_COOP_LIST_COLUMNS}
            rows={workCoopRows}
            filterTitle="미처리"
            filterHint="(처리일자 없음)"
          />
        ) : isSuggestionList ? (
          <ReviewProcessFilterFormsTable
            storageKey={SUGGESTION_LIST_STORAGE_KEY}
            columns={SUGGESTION_LIST_COLUMNS}
            rows={suggestionRows}
            filterTitle="미처리"
            filterHint="(처리(예정)일자 없음)"
          />
        ) : (
          <ul className="divide-y divide-zinc-100">
            {forms.map((f) => {
              const commentCp = getCommentPreview(
                f.events[0],
                commentCountMap.get(f.id) ?? 0
              );
              return (
              <li key={f.id} className="px-4 py-3 hover:bg-zinc-50">
                <Link href={`/forms/${f.id}`} className="grid grid-cols-12 gap-2">
                  <div className="col-span-2 text-sm text-zinc-800">
                    {isFormTypeKey(f.type)
                      ? FORM_TYPE_LABEL[f.type]
                      : String(f.type)}
                  </div>
                  <div className="col-span-3 min-w-0 text-sm font-medium text-zinc-900">
                    {f.title}
                  </div>
                  <div className="col-span-2 text-sm text-zinc-700">
                    {statusLabel[String(f.status)] ?? String(f.status)}
                  </div>
                  <div className="col-span-2 text-sm text-zinc-700">
                    {f.createdBy.name}
                  </div>
                  <div className="col-span-2 min-w-0 text-xs text-zinc-700">
                    {commentCp ? (
                      <div
                        className="line-clamp-2 whitespace-pre-wrap"
                        title={commentCp.tooltip}
                      >
                        {commentCp.line}
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right text-xs text-zinc-500">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

