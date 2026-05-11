import Link from "next/link";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { FORM_TYPE_LABEL, isFormTypeKey, type FormTypeKey } from "@/lib/formTypes";

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
  reporterConfirm?: { content?: unknown };
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

/** 최신 댓글 미리보기 + 마우스 호버 시 전체 (목록 표 전용) */
function CommentCell({
  latest,
  totalCount,
}: {
  latest?: LatestComment;
  totalCount: number;
}) {
  const preview = getCommentPreview(latest, totalCount);
  if (!preview) {
    return (
      <td className="max-w-[11rem] border-b border-zinc-100 px-2 py-2 align-top text-xs leading-snug text-zinc-500">
        —
      </td>
    );
  }
  return (
    <td className="max-w-[11rem] border-b border-zinc-100 px-2 py-2 align-top text-xs leading-snug text-zinc-800">
      <div
        className="line-clamp-2 break-words whitespace-pre-wrap"
        title={preview.tooltip}
      >
        {preview.line}
      </div>
    </td>
  );
}

/** 표시가 잘릴 수 있는 셀: 명시 title 없으면 문자열 children 전체를 네이티브 툴팁으로 */
function cellTooltip(
  explicitTitle: string | undefined,
  children: ReactNode
): string | undefined {
  if (explicitTitle != null && String(explicitTitle).trim() !== "") {
    return explicitTitle;
  }
  if (typeof children === "string") {
    const t = children.trim();
    if (t === "" || t === "—") return undefined;
    return children;
  }
  return undefined;
}

function ListCell({
  children,
  title,
  compact,
  wide,
  dateColumn,
}: {
  children: ReactNode;
  title?: string;
  /** 짧은 고정폭(일자·이름 등); 길면 말줄임, 전체는 title 툴팁 */
  compact?: boolean;
  /** 불만 목록 등 긴 본문 열 — 기본보다 넓게 */
  wide?: boolean;
  /** 불만 목록 접수일 등 짧은 날짜 열 */
  dateColumn?: boolean;
}) {
  const tip = cellTooltip(title, children);
  if (dateColumn && !compact && !wide) {
    return (
      <td className="w-[5rem] max-w-[5rem] shrink-0 border-b border-zinc-100 px-1.5 py-2 align-top text-xs leading-snug text-zinc-800">
        <div className="truncate whitespace-nowrap" title={tip}>
          {children}
        </div>
      </td>
    );
  }
  if (compact) {
    return (
      <td className="w-[8.5rem] max-w-[8.5rem] shrink-0 border-b border-zinc-100 px-1.5 py-2 align-top text-xs leading-snug text-zinc-800">
        <div className="truncate" title={tip}>
          {children}
        </div>
      </td>
    );
  }
  return (
    <td
      className={
        wide
          ? "min-w-[13rem] max-w-[13rem] border-b border-zinc-100 px-2 py-2 align-top text-xs leading-snug text-zinc-800"
          : "max-w-[11rem] border-b border-zinc-100 px-2 py-2 align-top text-xs leading-snug text-zinc-800"
      }
    >
      <div
        className="line-clamp-3 break-words whitespace-pre-wrap"
        title={tip}
      >
        {children}
      </div>
    </td>
  );
}

function NoCell({ href, no }: { href: string; no: string }) {
  const label = no.trim() !== "" ? no : "—";
  return (
    <td className="w-14 max-w-14 border-b border-zinc-100 px-1 py-2 align-top">
      <Link
        href={href}
        title={label !== "—" ? label : undefined}
        className="block truncate whitespace-nowrap font-medium text-zinc-900 hover:underline"
      >
        {label}
      </Link>
    </td>
  );
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

  const loadFormDataJson =
    isComplaintList ||
    isQualityImprovementList ||
    isAbnormalList ||
    isWorkCoopList ||
    isSuggestionList;

  const showWideTableHint =
    type === "COMPLAINT" ||
    type === "QUALITY_IMPROVEMENT" ||
    type === "ABNORMAL_REPORT" ||
    type === "WORK_COOP" ||
    type === "SUGGESTION";

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

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">서식 목록</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {type
              ? `${FORM_TYPE_LABEL[type]}만 표시합니다. (최근 50건)${
                  showWideTableHint
                    ? " · 표가 넓으면 아래를 좌우로 스크롤하세요."
                    : ""
                } · 댓글은 최신 글 미리보기이며, 마우스를 올리면 전체와 건수를 볼 수 있어요.`
              : "최근 50건까지 표시됩니다. · 댓글은 최신 글 미리보기이며, 마우스를 올리면 전체와 건수를 볼 수 있어요."}
          </p>
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
            아직 서식이 없어요. 우측 상단에서 새 서식을 만들어 보세요.
          </div>
        ) : isComplaintList ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[2230px] table-fixed border-collapse text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
                <tr>
                  <th className="w-14 whitespace-nowrap px-2 py-2">NO</th>
                  <th className="w-[5rem] max-w-[5rem] shrink-0 whitespace-nowrap px-1.5 py-2">
                    접수일
                  </th>
                  <th className="w-28 px-2 py-2">고객정보</th>
                  <th className="w-28 px-2 py-2">제품명</th>
                  <th className="w-28 px-2 py-2">부서_담당자</th>
                  <th className="w-36 px-2 py-2">내용</th>
                  <th className="w-36 px-2 py-2">조치내용</th>
                  <th className="w-[8.5rem] max-w-[8.5rem] shrink-0 whitespace-normal px-1.5 py-2 text-[11px] leading-tight">
                    사외AS일자및실시자
                  </th>
                  <th className="w-36 px-2 py-2">사외AS내용</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    회수일
                  </th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    원인분석일자
                  </th>
                  <th className="min-w-[13rem] w-[13rem] px-2 py-2">
                    불량현상
                  </th>
                  <th className="min-w-[13rem] w-[13rem] px-2 py-2">
                    불량원인분석
                  </th>
                  <th className="min-w-[13rem] w-[13rem] px-2 py-2">
                    재발방지대책
                  </th>
                  <th className="w-44 px-2 py-2">회수품처리내용</th>
                  <th className="w-[11rem] max-w-[11rem] px-2 py-2">댓글</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => {
                  const row = complaintListRow(f.data, f.title);
                  const productLabel =
                    row.productName != null &&
                    String(row.productName).trim() !== ""
                      ? String(row.productName)
                      : "—";
                  const deptLabel =
                    row.departmentAndOwner != null &&
                    String(row.departmentAndOwner).trim() !== ""
                      ? String(row.departmentAndOwner)
                      : "—";
                  const customerLabel = row.customerInfo;
                  return (
                    <tr key={f.id} className="hover:bg-zinc-50">
                      <NoCell href={`/forms/${f.id}`} no={String(row.no)} />
                      <ListCell dateColumn>
                        {formatListDate(row.receiptDate)}
                      </ListCell>
                      <ListCell
                        title={
                          customerLabel !== "—" ? customerLabel : undefined
                        }
                      >
                        {customerLabel}
                      </ListCell>
                      <ListCell title={productLabel !== "—" ? productLabel : undefined}>
                        {productLabel}
                      </ListCell>
                      <ListCell title={deptLabel !== "—" ? deptLabel : undefined}>
                        {deptLabel}
                      </ListCell>
                      <ListCell
                        title={row.content !== "—" ? row.content : undefined}
                      >
                        {row.content}
                      </ListCell>
                      <ListCell
                        title={
                          row.actionContent !== "—"
                            ? row.actionContent
                            : undefined
                        }
                      >
                        {row.actionContent}
                      </ListCell>
                      <ListCell
                        compact
                        title={
                          row.outsideAsDateAndExecutor !== "—"
                            ? row.outsideAsDateAndExecutor
                            : undefined
                        }
                      >
                        {row.outsideAsDateAndExecutor}
                      </ListCell>
                      <ListCell
                        title={
                          row.outsideAsContent !== "—"
                            ? row.outsideAsContent
                            : undefined
                        }
                      >
                        {row.outsideAsContent}
                      </ListCell>
                      <ListCell>{formatListDate(row.recoveryDate)}</ListCell>
                      <ListCell>
                        {formatListDate(row.causeAnalysisDate)}
                      </ListCell>
                      <ListCell
                        wide
                        title={
                          row.defectPhenomenon !== "—"
                            ? row.defectPhenomenon
                            : undefined
                        }
                      >
                        {row.defectPhenomenon}
                      </ListCell>
                      <ListCell
                        wide
                        title={
                          row.defectCauseAnalysis !== "—"
                            ? row.defectCauseAnalysis
                            : undefined
                        }
                      >
                        {row.defectCauseAnalysis}
                      </ListCell>
                      <ListCell
                        wide
                        title={
                          row.recurrencePrevention !== "—"
                            ? row.recurrencePrevention
                            : undefined
                        }
                      >
                        {row.recurrencePrevention}
                      </ListCell>
                      <ListCell
                        title={
                          row.recoveryHandlingContent !== "—"
                            ? row.recoveryHandlingContent
                            : undefined
                        }
                      >
                        {row.recoveryHandlingContent}
                      </ListCell>
                      <CommentCell
                        latest={f.events[0]}
                        totalCount={commentCountMap.get(f.id) ?? 0}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : isQualityImprovementList ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1390px] table-fixed border-collapse text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
                <tr>
                  <th className="w-14 whitespace-nowrap px-2 py-2">NO</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    작성일
                  </th>
                  <th className="w-24 whitespace-nowrap px-2 py-2">작성자</th>
                  <th className="w-36 px-2 py-2">의뢰품명/사양</th>
                  <th className="w-36 px-2 py-2">의뢰사유</th>
                  <th className="w-32 px-2 py-2">검토부서/담당자</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    검토일자
                  </th>
                  <th className="w-44 px-2 py-2">검토(개선)처리 내용</th>
                  <th className="w-40 px-2 py-2">의뢰자확인내용</th>
                  <th className="w-[11rem] max-w-[11rem] px-2 py-2">댓글</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => {
                  const authorLabel = listAuthorFromFormJson(
                    f.data,
                    "QUALITY_IMPROVEMENT",
                    f.createdBy.name
                  );
                  const row = qualityImprovementListRow(f.data, f.title);
                  return (
                    <tr key={f.id} className="hover:bg-zinc-50">
                      <NoCell href={`/forms/${f.id}`} no={String(row.no)} />
                      <ListCell>{formatListDate(f.createdAt)}</ListCell>
                      <ListCell title={authorLabel}>{authorLabel}</ListCell>
                      <ListCell
                        title={
                          row.itemSpec !== "—" ? row.itemSpec : undefined
                        }
                      >
                        {row.itemSpec}
                      </ListCell>
                      <ListCell
                        title={
                          row.requestReason !== "—"
                            ? row.requestReason
                            : undefined
                        }
                      >
                        {row.requestReason}
                      </ListCell>
                      <ListCell
                        title={
                          row.reviewDeptOwner !== "—"
                            ? row.reviewDeptOwner
                            : undefined
                        }
                      >
                        {row.reviewDeptOwner}
                      </ListCell>
                      <ListCell>{formatListDate(row.reviewDate)}</ListCell>
                      <ListCell
                        title={
                          row.improvementContent !== "—"
                            ? row.improvementContent
                            : undefined
                        }
                      >
                        {row.improvementContent}
                      </ListCell>
                      <ListCell
                        title={
                          row.requesterConfirmContent !== "—"
                            ? row.requesterConfirmContent
                            : undefined
                        }
                      >
                        {row.requesterConfirmContent}
                      </ListCell>
                      <CommentCell
                        latest={f.events[0]}
                        totalCount={commentCountMap.get(f.id) ?? 0}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : isAbnormalList ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1550px] table-fixed border-collapse text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
                <tr>
                  <th className="w-14 whitespace-nowrap px-2 py-2">NO</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    작성일
                  </th>
                  <th className="w-24 whitespace-nowrap px-2 py-2">작성자</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    신고일자
                  </th>
                  <th className="w-36 px-2 py-2">이상발생품명/사양</th>
                  <th className="w-40 px-2 py-2">
                    문제점 및 이상현상/요구사항
                  </th>
                  <th className="w-32 px-2 py-2">처리부서/담당자</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    처리일자
                  </th>
                  <th className="w-44 px-2 py-2">
                    원인 및 시정조치/예방
                  </th>
                  <th className="w-36 px-2 py-2">신고자확인내용</th>
                  <th className="w-[11rem] max-w-[11rem] px-2 py-2">댓글</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => {
                  const authorLabel = listAuthorFromFormJson(
                    f.data,
                    "ABNORMAL_REPORT",
                    f.createdBy.name
                  );
                  const row = abLikeListRow(f.data, f.title, "ABNORMAL_REPORT");
                  return (
                    <tr key={f.id} className="hover:bg-zinc-50">
                      <NoCell href={`/forms/${f.id}`} no={String(row.no)} />
                      <ListCell>{formatListDate(f.createdAt)}</ListCell>
                      <ListCell title={authorLabel}>{authorLabel}</ListCell>
                      <ListCell>{formatListDate(row.reportDate)}</ListCell>
                      <ListCell
                        title={row.itemSpec !== "—" ? row.itemSpec : undefined}
                      >
                        {row.itemSpec}
                      </ListCell>
                      <ListCell
                        title={
                          row.problemAndRequest !== "—"
                            ? row.problemAndRequest
                            : undefined
                        }
                      >
                        {row.problemAndRequest}
                      </ListCell>
                      <ListCell
                        title={
                          row.handlingDeptOwner !== "—"
                            ? row.handlingDeptOwner
                            : undefined
                        }
                      >
                        {row.handlingDeptOwner}
                      </ListCell>
                      <ListCell>{formatListDate(row.handlingDate)}</ListCell>
                      <ListCell
                        title={
                          row.causeAndAction !== "—"
                            ? row.causeAndAction
                            : undefined
                        }
                      >
                        {row.causeAndAction}
                      </ListCell>
                      <ListCell
                        title={
                          row.reporterConfirmContent !== "—"
                            ? row.reporterConfirmContent
                            : undefined
                        }
                      >
                        {row.reporterConfirmContent}
                      </ListCell>
                      <CommentCell
                        latest={f.events[0]}
                        totalCount={commentCountMap.get(f.id) ?? 0}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : isWorkCoopList ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1550px] table-fixed border-collapse text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
                <tr>
                  <th className="w-14 whitespace-nowrap px-2 py-2">NO</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    작성일
                  </th>
                  <th className="w-24 whitespace-nowrap px-2 py-2">작성자</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    요청일자
                  </th>
                  <th className="w-36 px-2 py-2">요청품목/사양</th>
                  <th className="w-40 px-2 py-2">협조요청내용 및 사유</th>
                  <th className="w-32 px-2 py-2">수신부서/담당자</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    처리일자
                  </th>
                  <th className="w-44 px-2 py-2">업무협조 처리내용</th>
                  <th className="w-36 px-2 py-2">요청자확인내용</th>
                  <th className="w-[11rem] max-w-[11rem] px-2 py-2">댓글</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => {
                  const authorLabel = listAuthorFromFormJson(
                    f.data,
                    "WORK_COOP",
                    f.createdBy.name
                  );
                  const row = abLikeListRow(f.data, f.title, "WORK_COOP");
                  return (
                    <tr key={f.id} className="hover:bg-zinc-50">
                      <NoCell href={`/forms/${f.id}`} no={String(row.no)} />
                      <ListCell>{formatListDate(f.createdAt)}</ListCell>
                      <ListCell title={authorLabel}>{authorLabel}</ListCell>
                      <ListCell>{formatListDate(row.reportDate)}</ListCell>
                      <ListCell
                        title={row.itemSpec !== "—" ? row.itemSpec : undefined}
                      >
                        {row.itemSpec}
                      </ListCell>
                      <ListCell
                        title={
                          row.problemAndRequest !== "—"
                            ? row.problemAndRequest
                            : undefined
                        }
                      >
                        {row.problemAndRequest}
                      </ListCell>
                      <ListCell
                        title={
                          row.handlingDeptOwner !== "—"
                            ? row.handlingDeptOwner
                            : undefined
                        }
                      >
                        {row.handlingDeptOwner}
                      </ListCell>
                      <ListCell>{formatListDate(row.handlingDate)}</ListCell>
                      <ListCell
                        title={
                          row.causeAndAction !== "—"
                            ? row.causeAndAction
                            : undefined
                        }
                      >
                        {row.causeAndAction}
                      </ListCell>
                      <ListCell
                        title={
                          row.reporterConfirmContent !== "—"
                            ? row.reporterConfirmContent
                            : undefined
                        }
                      >
                        {row.reporterConfirmContent}
                      </ListCell>
                      <CommentCell
                        latest={f.events[0]}
                        totalCount={commentCountMap.get(f.id) ?? 0}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : isSuggestionList ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1650px] table-fixed border-collapse text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
                <tr>
                  <th className="w-14 whitespace-nowrap px-2 py-2">NO</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    작성일
                  </th>
                  <th className="w-24 whitespace-nowrap px-2 py-2">작성자</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    제안일자
                  </th>
                  <th className="w-40 px-2 py-2">제안내용</th>
                  <th className="w-36 px-2 py-2">제안효과</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    심사일
                  </th>
                  <th className="w-40 px-2 py-2">심사자 Comment 등</th>
                  <th className="w-[5.5rem] whitespace-nowrap px-2 py-2">
                    처리(예정)일자
                  </th>
                  <th className="w-40 px-2 py-2">처리내용</th>
                  <th className="w-[11rem] max-w-[11rem] px-2 py-2">댓글</th>
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => {
                  const authorLabel = listAuthorFromFormJson(
                    f.data,
                    "SUGGESTION",
                    f.createdBy.name
                  );
                  const row = suggestionListRow(f.data, f.title);
                  return (
                    <tr key={f.id} className="hover:bg-zinc-50">
                      <NoCell href={`/forms/${f.id}`} no={String(row.no)} />
                      <ListCell>{formatListDate(f.createdAt)}</ListCell>
                      <ListCell title={authorLabel}>{authorLabel}</ListCell>
                      <ListCell>
                        {formatListDate(row.proposalDate)}
                      </ListCell>
                      <ListCell
                        title={
                          row.proposalContent !== "—"
                            ? row.proposalContent
                            : undefined
                        }
                      >
                        {row.proposalContent}
                      </ListCell>
                      <ListCell
                        title={
                          row.proposalEffect !== "—"
                            ? row.proposalEffect
                            : undefined
                        }
                      >
                        {row.proposalEffect}
                      </ListCell>
                      <ListCell>{formatListDate(row.reviewDate)}</ListCell>
                      <ListCell
                        title={
                          row.reviewerComment !== "—"
                            ? row.reviewerComment
                            : undefined
                        }
                      >
                        {row.reviewerComment}
                      </ListCell>
                      <ListCell>
                        {formatListDate(row.processingPlannedDate)}
                      </ListCell>
                      <ListCell
                        title={
                          row.processingContent !== "—"
                            ? row.processingContent
                            : undefined
                        }
                      >
                        {row.processingContent}
                      </ListCell>
                      <CommentCell
                        latest={f.events[0]}
                        totalCount={commentCountMap.get(f.id) ?? 0}
                      />
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

