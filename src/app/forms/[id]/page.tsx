import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import CommentsPanel from "@/app/forms/[id]/CommentsPanel";

function DetailBlock({
  label,
  children,
  emphasize,
}: {
  label: string;
  children: ReactNode;
  emphasize?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div
        className={
          emphasize
            ? "whitespace-pre-wrap rounded-xl border border-zinc-100 bg-white px-3 py-3 text-sm leading-relaxed text-zinc-900 shadow-sm"
            : "break-words text-sm leading-relaxed text-zinc-900"
        }
      >
        {children}
      </div>
    </div>
  );
}

function InfoRow({
  columns,
  forceHorizontal,
}: {
  columns: { label: string; value: ReactNode; flex?: string }[];
  forceHorizontal?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white">
      <div
        className={`divide-y divide-zinc-200 ${forceHorizontal ? "flex divide-x divide-y-0" : "md:flex md:divide-x md:divide-y-0"}`}
      >
        {columns.map((c, idx) => (
          <div
            key={`${idx}-${c.label}`}
            className={`min-w-0 px-3 py-2.5 md:py-3 ${c.flex ?? "flex-1"}`}
          >
            <div className="text-xs font-medium text-zinc-500 md:whitespace-nowrap">
              {c.label}
            </div>
            <div className="mt-1 break-words text-sm leading-snug text-zinc-900">
              {c.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const typeLabel: Record<string, string> = {
  COMPLAINT: "불만신고서",
  QUALITY_IMPROVEMENT: "품질개선의뢰서",
  ABNORMAL_REPORT: "이상발생신고서",
  WORK_COOP: "업무협조전",
  SUGGESTION: "제안서",
};

const statusLabel: Record<string, string> = {
  DRAFT: "작성중",
  SUBMITTED: "제출",
  IN_REVIEW: "검토중",
  APPROVED: "승인",
  REJECTED: "반려",
  CLOSED: "종료",
};

/** 접수 일자 등을 한국어 달력 표기(작성일 기준으로 읽기 쉽게) */
function formatKoreanCalendarDate(raw: unknown): string {
  if (raw === undefined || raw === null) return "—";
  const s = String(raw).trim();
  if (s === "") return "—";
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s)
    ? new Date(`${s}T12:00:00`)
    : new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });
}

/** 표 형태 한 줄 행용(요일 생략 → 칸이 좁아져도 덜 깨짐) */
function formatKoreanDateCompact(raw: unknown): string {
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

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      events: {
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { actor: { select: { name: true } } },
      },
    },
  });
  if (!form) notFound();
  const comments = form.events
    .filter((e) => e.action === "COMMENT")
    .slice()
    .reverse()
    .map((e) => {
      const p = e.payload as { text?: unknown } | null;
      const text = p?.text != null ? String(p.text) : "";
      return {
        id: e.id,
        text,
        actorName: e.actor.name,
        createdAt: new Date(e.createdAt).toLocaleString(),
      };
    })
    .filter((c) => c.text.trim() !== "");

  const data = form.data as {
    summary?: unknown;
    details?: unknown;
    qualityImprovement?: {
      formNo?: unknown;
      receipt?: {
        date?: unknown;
        writerName?: unknown;
        itemSpec?: unknown;
        requestReasonDetails?: unknown;
        reviewDepartmentOwner?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
      review?: {
        date?: unknown;
        decisionDateReason?: unknown;
        improvementContent?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
      requesterConfirm?: { date?: unknown; content?: unknown };
    };
    abnormalReport?: {
      formNo?: unknown;
      report?: {
        date?: unknown;
        writerName?: unknown;
        itemSpec?: unknown;
        problemAndRequest?: unknown;
        handlingDepartmentOwner?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
      handlingReport?: {
        date?: unknown;
        plannedDateReason?: unknown;
        causeAndActionPrevention?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
      reporterConfirm?: { date?: unknown; content?: unknown };
    };
    workCoop?: {
      formNo?: unknown;
      report?: {
        date?: unknown;
        writerName?: unknown;
        itemSpec?: unknown;
        problemAndRequest?: unknown;
        handlingDepartmentOwner?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
      handlingReport?: {
        date?: unknown;
        plannedDateReason?: unknown;
        causeAndActionPrevention?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
      reporterConfirm?: { date?: unknown; content?: unknown };
    };
    suggestion?: {
      formNo?: unknown;
      proposal?: {
        date?: unknown;
        writerName?: unknown;
        content?: unknown;
        effect?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
      reviewResult?: {
        reviewDate?: unknown;
        reviewerCommentLine?: unknown;
        processingPlannedDate?: unknown;
        processingContent?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
    };
    complaint?: {
      formNo?: unknown;
      receipt?: {
        date?: unknown;
        complaintProductName?: unknown;
        departmentAndOwner?: unknown;
        customerInfo?: unknown;
        productAndComplaint?: unknown;
        productManufacturing?: unknown;
        actionContent?: unknown;
        manufacturing?: {
          no?: unknown;
          date?: unknown;
          worker?: unknown;
        };
        photoAttachment?: {
          uploadedUrl?: string;
          externalUrl?: string;
        };
        photoNote?: string;
      };
      outsideAs?: {
        date?: unknown;
        executor?: unknown;
        place?: unknown;
        duration?: unknown;
        contentAndResult?: unknown;
        photoAttachment?: {
          uploadedUrl?: string;
          externalUrl?: string;
        };
      };
      productionHandlingReport?: {
        defectiveProductRecoveryDate?: unknown;
        causeAnalysisDate?: unknown;
        recoveredManufacturingInfo?: unknown;
        recoveredOperationAndAppearanceDefect?: unknown;
        recoveredOperation?: unknown;
        appearanceDefectPhenomenon?: unknown;
        defectCauseAnalysis?: unknown;
        causeAnalysisRefPhoto?: {
          uploadedUrl?: string;
          externalUrl?: string;
        };
        recurrencePreventionMeasures?: unknown;
        recurrencePreventionRefPhoto?: {
          uploadedUrl?: string;
          externalUrl?: string;
        };
      };
      researchLabHandlingReport?: {
        chargePerson?: unknown;
        causeAnalysisDate?: unknown;
        causeAnalysis?: unknown;
        causeAnalysisRefPhoto?: {
          uploadedUrl?: string;
          externalUrl?: string;
        };
        recurrencePreventionMeasures?: unknown;
        recurrencePreventionRefPhoto?: {
          uploadedUrl?: string;
          externalUrl?: string;
        };
      };
      recoveredProductHandling?: {
        processingDate?: unknown;
        processingContent?: unknown;
        processingDetail?: unknown;
      };
    };
  };

  const receipt = data.complaint?.receipt;
  const manufacturingLine =
    String(form.type) === "COMPLAINT" && receipt
      ? (() => {
          const pm = receipt.productManufacturing;
          if (pm !== undefined && pm !== null && String(pm).trim() !== "") {
            return String(pm);
          }
          const m = receipt.manufacturing;
          if (m && (m.no || m.date || m.worker)) {
            return [m.no, m.date, m.worker]
              .filter((x) => x !== undefined && x !== null && String(x).trim() !== "")
              .map(String)
              .join(" / ");
          }
          return null;
        })()
      : null;

  const photo = data.complaint?.receipt?.photoAttachment;
  const legacyPhotoNote = data.complaint?.receipt?.photoNote;
  const outsideAs = data.complaint?.outsideAs;
  const outsidePhoto = outsideAs?.photoAttachment;
  const prodReport = data.complaint?.productionHandlingReport;
  const prodCausePhoto = prodReport?.causeAnalysisRefPhoto;
  const prodRecurrencePhoto = prodReport?.recurrencePreventionRefPhoto;
  const labReport = data.complaint?.researchLabHandlingReport;
  const labCausePhoto = labReport?.causeAnalysisRefPhoto;
  const labRecurrencePhoto = labReport?.recurrencePreventionRefPhoto;
  const recoveryHandling = data.complaint?.recoveredProductHandling;
  const qi = data.qualityImprovement;
  const sg = data.suggestion;
  const ab = data.abnormalReport;
  const wc = data.workCoop;
  const abLike =
    String(form.type) === "ABNORMAL_REPORT"
      ? ab
      : String(form.type) === "WORK_COOP"
        ? wc
        : undefined;
  const isWorkCoopDetail = String(form.type) === "WORK_COOP";

  /** 작성 폼과 동일 소스: receipt 우선, 구버전은 summary/details 폴백 */
  const receiptCustomerInfo =
    receipt?.customerInfo != null && String(receipt.customerInfo).trim() !== ""
      ? String(receipt.customerInfo)
      : "";
  const receiptProductComplaint =
    receipt?.productAndComplaint != null &&
    String(receipt.productAndComplaint).trim() !== ""
      ? String(receipt.productAndComplaint)
      : String(data.summary ?? "").trim() !== ""
        ? String(data.summary)
        : "";
  const receiptActionContent =
    receipt?.actionContent != null &&
    String(receipt.actionContent).trim() !== ""
      ? String(receipt.actionContent)
      : String(data.details ?? "").trim() !== ""
        ? String(data.details)
        : "";

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-zinc-500">
            {typeLabel[String(form.type)] ?? String(form.type)} ·{" "}
            {statusLabel[String(form.status)] ?? String(form.status)}
          </div>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">
            {form.title}
          </h1>
          <div className="mt-1 text-sm text-zinc-600">
            작성자 {form.createdBy.name} ·{" "}
            {new Date(form.createdAt).toLocaleString()}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {String(form.type) === "COMPLAINT" ||
          String(form.type) === "QUALITY_IMPROVEMENT" ||
          String(form.type) === "ABNORMAL_REPORT" ||
          String(form.type) === "WORK_COOP" ||
          String(form.type) === "SUGGESTION" ? (
            <Link
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
              href={`/forms/${form.id}/edit`}
            >
              수정
            </Link>
          ) : null}
          <Link
            className="text-sm font-medium text-zinc-900 underline"
            href="/forms"
          >
            목록
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,20rem)] xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-800 sm:px-5">
            내용
          </div>
          <div className="space-y-6 p-4 sm:p-6">
            {String(form.type) === "COMPLAINT" && receipt ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50/95 to-white">
                <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-white/70 px-4 py-3 sm:px-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                    1
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-zinc-900">
                      접수
                    </div>
                    <div className="text-xs text-zinc-500">
                      작성 화면 「1. 접수」와 같은 순서·항목입니다.
                    </div>
                  </div>
                </div>
                <div className="space-y-5 px-4 py-5 sm:px-6">
                  <InfoRow
                    columns={[
                      {
                        label: "일자",
                        value: formatKoreanDateCompact(receipt.date),
                      },
                      {
                        label: "불만신고 제품명",
                        value: receipt.complaintProductName
                          ? String(receipt.complaintProductName)
                          : "—",
                      },
                      {
                        label: "해당부서 및 담당자",
                        value: receipt.departmentAndOwner
                          ? String(receipt.departmentAndOwner)
                          : "—",
                      },
                    ]}
                  />

                  <DetailBlock label="고객정보 (업체/고객명/연락처)">
                    {receiptCustomerInfo || "—"}
                  </DetailBlock>

                  <DetailBlock label="세부품명 및 불만신고내용" emphasize>
                    {receiptProductComplaint.trim()
                      ? receiptProductComplaint
                      : "—"}
                  </DetailBlock>

                  <DetailBlock label="불만제품 제조번호 / 제조일자 / 작업자">
                    {manufacturingLine || "—"}
                  </DetailBlock>

                  {photo?.uploadedUrl ||
                  photo?.externalUrl ||
                  legacyPhotoNote ? (
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-zinc-500">
                        사진첨부
                      </div>
                      <div className="space-y-3">
                        {photo?.uploadedUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={photo.uploadedUrl}
                            alt="첨부 사진"
                            className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                          />
                        ) : null}
                        {photo?.externalUrl ? (
                          <div>
                            <a
                              href={photo.externalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm font-medium text-zinc-900 underline"
                            >
                              이미지 링크 열기
                            </a>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={photo.externalUrl}
                              alt="외부 이미지"
                              className="mt-2 max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                            />
                          </div>
                        ) : null}
                        {legacyPhotoNote && !photo?.uploadedUrl && !photo?.externalUrl ? (
                          <div className="whitespace-pre-wrap rounded-xl border border-zinc-100 bg-white px-3 py-3 text-sm text-zinc-800 shadow-sm">
                            {String(legacyPhotoNote)}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <DetailBlock label="조치내용" emphasize>
                    {receiptActionContent.trim()
                      ? receiptActionContent
                      : "—"}
                  </DetailBlock>
                </div>
              </div>
            ) : null}

            {String(form.type) === "QUALITY_IMPROVEMENT" && qi?.receipt ? (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50/95 to-white">
                  <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-white/70 px-4 py-3 sm:px-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                      1
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">
                        접수
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 px-4 py-5 sm:px-6">
                    <InfoRow
                      columns={[
                        {
                          label: "일자",
                          value: formatKoreanDateCompact(qi.receipt.date),
                          flex: "flex-[0.8]",
                        },
                        {
                          label: "작성자",
                          value:
                            qi.receipt.writerName != null &&
                            String(qi.receipt.writerName).trim() !== ""
                              ? String(qi.receipt.writerName)
                              : "—",
                          flex: "flex-[0.9]",
                        },
                        {
                          label: "의뢰품명/사양",
                          value:
                            qi.receipt.itemSpec != null &&
                            String(qi.receipt.itemSpec).trim() !== ""
                              ? String(qi.receipt.itemSpec)
                              : "—",
                          flex: "flex-[1.7]",
                        },
                        {
                          label: "검토부서/담당자",
                          value:
                            qi.receipt.reviewDepartmentOwner != null &&
                            String(qi.receipt.reviewDepartmentOwner).trim() !== ""
                              ? String(qi.receipt.reviewDepartmentOwner)
                              : "—",
                          flex: "flex-[1.2]",
                        },
                      ]}
                    />

                    <DetailBlock label="의뢰사유 및 세부 의뢰내용" emphasize>
                      {qi.receipt.requestReasonDetails != null &&
                      String(qi.receipt.requestReasonDetails).trim() !== ""
                        ? String(qi.receipt.requestReasonDetails)
                        : "—"}
                    </DetailBlock>

                    {qi.receipt.photoAttachment?.uploadedUrl ||
                    qi.receipt.photoAttachment?.externalUrl ? (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-zinc-500">
                          의뢰내용에 대한 사진 첨부
                        </div>
                        <div className="space-y-3">
                          {qi.receipt.photoAttachment.uploadedUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={qi.receipt.photoAttachment.uploadedUrl}
                              alt="의뢰내용 첨부 사진"
                              className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                            />
                          ) : null}
                          {qi.receipt.photoAttachment.externalUrl ? (
                            <div>
                              <a
                                href={qi.receipt.photoAttachment.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-zinc-900 underline"
                              >
                                이미지 링크 열기
                              </a>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={qi.receipt.photoAttachment.externalUrl}
                                alt="의뢰내용 외부 이미지"
                                className="mt-2 max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {qi.review ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                        2
                      </span>
                      <div className="text-sm font-semibold text-zinc-900">
                        검토 회신서
                      </div>
                    </div>

                    <div className="space-y-3">
                      <InfoRow
                        columns={[
                          {
                            label: "검토일자",
                            value: formatKoreanDateCompact(qi.review.date),
                            flex: "flex-1",
                          },
                          {
                            label: "검토예정일자/사유",
                            value:
                              qi.review.decisionDateReason != null &&
                              String(qi.review.decisionDateReason).trim() !== ""
                                ? String(qi.review.decisionDateReason)
                                : "—",
                            flex: "flex-[1.8]",
                          },
                        ]}
                      />

                      <DetailBlock label="검토 및 개선 처리 내용" emphasize>
                        {qi.review.improvementContent != null &&
                        String(qi.review.improvementContent).trim() !== ""
                          ? String(qi.review.improvementContent)
                          : "—"}
                      </DetailBlock>

                      {qi.review.photoAttachment?.uploadedUrl ||
                      qi.review.photoAttachment?.externalUrl ? (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-zinc-500">
                            처리내용에 대한 사진 첨부
                          </div>
                          <div className="space-y-3">
                            {qi.review.photoAttachment.uploadedUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={qi.review.photoAttachment.uploadedUrl}
                                alt="처리내용 첨부 사진"
                                className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                              />
                            ) : null}
                            {qi.review.photoAttachment.externalUrl ? (
                              <div>
                                <a
                                  href={qi.review.photoAttachment.externalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-zinc-900 underline"
                                >
                                  이미지 링크 열기
                                </a>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={qi.review.photoAttachment.externalUrl}
                                  alt="처리내용 외부 이미지"
                                  className="mt-2 max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {qi.requesterConfirm ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                        3
                      </span>
                      <div className="text-sm font-semibold text-zinc-900">
                        의뢰자 확인
                      </div>
                    </div>
                    <InfoRow
                      forceHorizontal
                      columns={[
                        {
                          label: "확인날짜",
                          value: formatKoreanDateCompact(qi.requesterConfirm.date),
                          flex: "flex-1",
                        },
                        {
                          label: "확인내용",
                          value:
                            qi.requesterConfirm.content != null &&
                            String(qi.requesterConfirm.content).trim() !== ""
                              ? String(qi.requesterConfirm.content)
                              : "—",
                          flex: "flex-[2.2]",
                        },
                      ]}
                    />
                  </div>
                ) : null}
              </div>
            ) : String(form.type) === "SUGGESTION" && sg?.proposal ? (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50/95 to-white">
                  <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-white/70 px-4 py-3 sm:px-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                      1
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">
                        제안서
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 px-4 py-5 sm:px-6">
                    <InfoRow
                      columns={[
                        {
                          label: "작성일자",
                          value: formatKoreanDateCompact(sg.proposal.date),
                          flex: "flex-1",
                        },
                        {
                          label: "작성자",
                          value:
                            sg.proposal.writerName != null &&
                            String(sg.proposal.writerName).trim() !== ""
                              ? String(sg.proposal.writerName)
                              : "—",
                          flex: "flex-1",
                        },
                      ]}
                    />
                    <DetailBlock label="제안내용" emphasize>
                      {sg.proposal.content != null &&
                      String(sg.proposal.content).trim() !== ""
                        ? String(sg.proposal.content)
                        : "—"}
                    </DetailBlock>
                    <DetailBlock label="제안효과" emphasize>
                      {sg.proposal.effect != null &&
                      String(sg.proposal.effect).trim() !== ""
                        ? String(sg.proposal.effect)
                        : "—"}
                    </DetailBlock>
                    {sg.proposal.photoAttachment?.uploadedUrl ||
                    sg.proposal.photoAttachment?.externalUrl ? (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-zinc-500">
                          제안내용에 대한 사진 첨부
                        </div>
                        <div className="space-y-3">
                          {sg.proposal.photoAttachment.uploadedUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={sg.proposal.photoAttachment.uploadedUrl}
                              alt="제안내용 첨부 사진"
                              className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                            />
                          ) : null}
                          {sg.proposal.photoAttachment.externalUrl ? (
                            <div>
                              <a
                                href={sg.proposal.photoAttachment.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-zinc-900 underline"
                              >
                                이미지 링크 열기
                              </a>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={sg.proposal.photoAttachment.externalUrl}
                                alt="제안내용 외부 이미지"
                                className="mt-2 max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {sg.reviewResult ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                        2
                      </span>
                      <div className="text-sm font-semibold text-zinc-900">
                        심사결과서
                      </div>
                    </div>
                    <div className="space-y-3">
                      <InfoRow
                        columns={[
                          {
                            label: "심사일",
                            value: formatKoreanDateCompact(
                              sg.reviewResult.reviewDate
                            ),
                            flex: "flex-1",
                          },
                          {
                            label:
                              "심사자 Comment_시행여부/처리자/포상금등",
                            value:
                              sg.reviewResult.reviewerCommentLine != null &&
                              String(sg.reviewResult.reviewerCommentLine).trim() !==
                                ""
                                ? String(sg.reviewResult.reviewerCommentLine)
                                : "—",
                            flex: "flex-[2]",
                          },
                        ]}
                      />
                      <InfoRow
                        columns={[
                          {
                            label: "처리(예정)일자",
                            value: formatKoreanDateCompact(
                              sg.reviewResult.processingPlannedDate
                            ),
                            flex: "flex-1",
                          },
                        ]}
                      />
                      <DetailBlock label="처리내용" emphasize>
                        {sg.reviewResult.processingContent != null &&
                        String(sg.reviewResult.processingContent).trim() !== ""
                          ? String(sg.reviewResult.processingContent)
                          : "—"}
                      </DetailBlock>
                      {sg.reviewResult.photoAttachment?.uploadedUrl ||
                      sg.reviewResult.photoAttachment?.externalUrl ? (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-zinc-500">
                            처리내용에 대한 사진 첨부
                          </div>
                          <div className="space-y-3">
                            {sg.reviewResult.photoAttachment.uploadedUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={sg.reviewResult.photoAttachment.uploadedUrl}
                                alt="처리내용 첨부 사진"
                                className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                              />
                            ) : null}
                            {sg.reviewResult.photoAttachment.externalUrl ? (
                              <div>
                                <a
                                  href={sg.reviewResult.photoAttachment.externalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-zinc-900 underline"
                                >
                                  이미지 링크 열기
                                </a>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={sg.reviewResult.photoAttachment.externalUrl}
                                  alt="처리내용 외부 이미지"
                                  className="mt-2 max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : abLike?.report ? (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-b from-zinc-50/95 to-white">
                  <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-white/70 px-4 py-3 sm:px-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-sm font-bold text-white">
                      1
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900">
                        {isWorkCoopDetail ? "업무협조" : "이상발생신고"}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 px-4 py-5 sm:px-6">
                    <InfoRow
                      columns={[
                        {
                          label: isWorkCoopDetail ? "요청일자" : "신고일자",
                          value: formatKoreanDateCompact(abLike.report.date),
                          flex: "flex-[0.8]",
                        },
                        {
                          label: "작성자",
                          value:
                            abLike.report.writerName != null &&
                            String(abLike.report.writerName).trim() !== ""
                              ? String(abLike.report.writerName)
                              : "—",
                          flex: "flex-[0.9]",
                        },
                        {
                          label: isWorkCoopDetail
                            ? "요청품목/사양"
                            : "이상발생품명/사양",
                          value:
                            abLike.report.itemSpec != null &&
                            String(abLike.report.itemSpec).trim() !== ""
                              ? String(abLike.report.itemSpec)
                              : "—",
                          flex: "flex-[1.7]",
                        },
                        {
                          label: isWorkCoopDetail
                            ? "수신부서/담당자"
                            : "처리부서/담당자",
                          value:
                            abLike.report.handlingDepartmentOwner != null &&
                            String(abLike.report.handlingDepartmentOwner).trim() !== ""
                              ? String(abLike.report.handlingDepartmentOwner)
                              : "—",
                          flex: "flex-[1.2]",
                        },
                      ]}
                    />

                    <DetailBlock
                      label={
                        isWorkCoopDetail
                          ? "협조요청내용 및 사유"
                          : "문제점 및 이상현상/요구사항"
                      }
                      emphasize
                    >
                      {abLike.report.problemAndRequest != null &&
                      String(abLike.report.problemAndRequest).trim() !== ""
                        ? String(abLike.report.problemAndRequest)
                        : "—"}
                    </DetailBlock>

                    {abLike.report.photoAttachment?.uploadedUrl ||
                    abLike.report.photoAttachment?.externalUrl ? (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-zinc-500">
                          {isWorkCoopDetail
                            ? "협조요청에 대한 사진 첨부"
                            : "이상현상 대한 사진 첨부"}
                        </div>
                        <div className="space-y-3">
                          {abLike.report.photoAttachment.uploadedUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={abLike.report.photoAttachment.uploadedUrl}
                              alt={
                                isWorkCoopDetail
                                  ? "협조요청 첨부 사진"
                                  : "이상현상 첨부 사진"
                              }
                              className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                            />
                          ) : null}
                          {abLike.report.photoAttachment.externalUrl ? (
                            <div>
                              <a
                                href={abLike.report.photoAttachment.externalUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sm font-medium text-zinc-900 underline"
                              >
                                이미지 링크 열기
                              </a>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={abLike.report.photoAttachment.externalUrl}
                                alt={
                                  isWorkCoopDetail
                                    ? "협조요청 외부 이미지"
                                    : "이상현상 외부 이미지"
                                }
                                className="mt-2 max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                              />
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>

                {abLike.handlingReport ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                        2
                      </span>
                      <div className="text-sm font-semibold text-zinc-900">
                        처리보고서
                      </div>
                    </div>

                    <div className="space-y-3">
                      <InfoRow
                        columns={[
                          {
                            label: "처리일자",
                            value: formatKoreanDateCompact(abLike.handlingReport.date),
                            flex: "flex-1",
                          },
                          {
                            label: "처리예정일자/사유",
                            value:
                              abLike.handlingReport.plannedDateReason != null &&
                              String(abLike.handlingReport.plannedDateReason).trim() !==
                                ""
                                ? String(abLike.handlingReport.plannedDateReason)
                                : "—",
                            flex: "flex-[1.8]",
                          },
                        ]}
                      />

                      <DetailBlock
                        label={
                          isWorkCoopDetail
                            ? "업무협조 처리내용"
                            : "원인 및 시정조치/예방 내용"
                        }
                        emphasize
                      >
                        {abLike.handlingReport.causeAndActionPrevention != null &&
                        String(abLike.handlingReport.causeAndActionPrevention).trim() !==
                          ""
                          ? String(abLike.handlingReport.causeAndActionPrevention)
                          : "—"}
                      </DetailBlock>

                      {abLike.handlingReport.photoAttachment?.uploadedUrl ||
                      abLike.handlingReport.photoAttachment?.externalUrl ? (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-zinc-500">
                            {isWorkCoopDetail
                              ? "처리내용에 대한 사진 첨부"
                              : "조치내용에 대한 사진 첨부"}
                          </div>
                          <div className="space-y-3">
                            {abLike.handlingReport.photoAttachment.uploadedUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={abLike.handlingReport.photoAttachment.uploadedUrl}
                                alt={
                                  isWorkCoopDetail
                                    ? "처리내용 첨부 사진"
                                    : "조치내용 첨부 사진"
                                }
                                className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                              />
                            ) : null}
                            {abLike.handlingReport.photoAttachment.externalUrl ? (
                              <div>
                                <a
                                  href={abLike.handlingReport.photoAttachment.externalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm font-medium text-zinc-900 underline"
                                >
                                  이미지 링크 열기
                                </a>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={abLike.handlingReport.photoAttachment.externalUrl}
                                  alt={
                                    isWorkCoopDetail
                                      ? "처리내용 외부 이미지"
                                      : "조치내용 외부 이미지"
                                  }
                                  className="mt-2 max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
                                />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {abLike.reporterConfirm ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                        3
                      </span>
                      <div className="text-sm font-semibold text-zinc-900">
                        {isWorkCoopDetail ? "요청자확인" : "신고자확인"}
                      </div>
                    </div>
                    <InfoRow
                      forceHorizontal
                      columns={[
                        {
                          label: "확인날짜",
                          value: formatKoreanDateCompact(abLike.reporterConfirm.date),
                          flex: "flex-1",
                        },
                        {
                          label: "확인내용",
                          value:
                            abLike.reporterConfirm.content != null &&
                            String(abLike.reporterConfirm.content).trim() !== ""
                              ? String(abLike.reporterConfirm.content)
                              : "—",
                          flex: "flex-[2.2]",
                        },
                      ]}
                    />
                  </div>
                ) : null}
              </div>
            ) : String(form.type) !== "COMPLAINT" || !receipt ? (
              <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 sm:p-5">
                <div>
                  <div className="text-xs font-medium text-zinc-500">요약</div>
                  <div className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-900">
                    {String(data.summary ?? "").trim() !== ""
                      ? String(data.summary)
                      : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-zinc-500">상세</div>
                  <div className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-zinc-900">
                    {String(data.details ?? "").trim() !== ""
                      ? String(data.details)
                      : "—"}
                  </div>
                </div>
              </div>
            ) : null}

            {String(form.type) === "COMPLAINT" && outsideAs ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                    2
                  </span>
                  <div className="text-sm font-semibold text-zinc-900">
                    사외 AS
                  </div>
                </div>
                <InfoRow
                  columns={[
                    {
                      label: "사외 AS 일자",
                      value: outsideAs.date
                        ? formatKoreanDateCompact(outsideAs.date)
                        : "—",
                      flex: "flex-1",
                    },
                    {
                      label: "실시자",
                      value: outsideAs.executor ? String(outsideAs.executor) : "—",
                      flex: "flex-1",
                    },
                    {
                      label: "장소",
                      value: outsideAs.place ? String(outsideAs.place) : "—",
                      flex: "flex-[1.6]",
                    },
                    {
                      label: "소요시간",
                      value: outsideAs.duration ? String(outsideAs.duration) : "—",
                      flex: "flex-1",
                    },
                  ]}
                />
                <div className="mt-3">
                  <div className="text-xs font-medium text-zinc-500">
                    사외 AS 실시내용 및 결과
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-900">
                    {outsideAs.contentAndResult
                      ? String(outsideAs.contentAndResult)
                      : "—"}
                  </div>
                </div>
                {outsidePhoto?.uploadedUrl ||
                outsidePhoto?.externalUrl ? (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-zinc-500">
                      관련사진
                    </div>
                    <div className="mt-2 space-y-3">
                      {outsidePhoto.uploadedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={outsidePhoto.uploadedUrl}
                          alt="사외 AS 관련 사진"
                          className="max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                        />
                      ) : null}
                      {outsidePhoto.externalUrl ? (
                        <div>
                          <a
                            href={outsidePhoto.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-zinc-900 underline"
                          >
                            이미지 링크 열기
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={outsidePhoto.externalUrl}
                            alt="외부 이미지"
                            className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {String(form.type) === "COMPLAINT" && prodReport ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                    3
                  </span>
                  <div className="text-sm font-semibold text-zinc-900">
                    생산_처리보고서
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white">
                    <div className="divide-y divide-zinc-200 md:flex md:divide-x md:divide-y-0">
                      <div className="min-w-0 flex-1 px-3 py-2.5 md:py-3">
                        <dt className="text-xs font-medium text-zinc-500">
                          불량제품 회수일자
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-900">
                          {prodReport.defectiveProductRecoveryDate
                            ? formatKoreanDateCompact(
                                prodReport.defectiveProductRecoveryDate
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div className="min-w-0 flex-1 px-3 py-2.5 md:py-3">
                        <dt className="text-xs font-medium text-zinc-500">
                          원인분석 일자
                        </dt>
                        <dd className="mt-1 text-sm text-zinc-900">
                          {prodReport.causeAnalysisDate
                            ? formatKoreanDateCompact(
                                prodReport.causeAnalysisDate
                              )
                            : "—"}
                        </dd>
                      </div>
                      <div className="min-w-0 flex-[1.6] px-3 py-2.5 md:py-3">
                        <dt className="text-xs font-medium text-zinc-500">
                          회수품 제조년월 / 작업자 / Ins&apos;NO
                        </dt>
                        <dd className="mt-1 break-words text-sm leading-snug text-zinc-900">
                          {prodReport.recoveredManufacturingInfo
                            ? String(prodReport.recoveredManufacturingInfo)
                            : "—"}
                        </dd>
                      </div>
                    </div>
                  </div>

                  <DetailBlock label="회수품 동작 · 외관 등 불량현상" emphasize>
                    {(() => {
                      const merged =
                        prodReport.recoveredOperationAndAppearanceDefect;
                      if (
                        merged !== undefined &&
                        merged !== null &&
                        String(merged).trim() !== ""
                      ) {
                        return String(merged);
                      }
                      const legacyOp = prodReport.recoveredOperation;
                      const legacyAp = prodReport.appearanceDefectPhenomenon;
                      const parts = [legacyOp, legacyAp]
                        .filter(
                          (x) =>
                            x !== undefined &&
                            x !== null &&
                            String(x).trim() !== ""
                        )
                        .map(String);
                      return parts.length > 0 ? parts.join("\n\n") : "—";
                    })()}
                  </DetailBlock>

                  <DetailBlock label="불량 원인분석" emphasize>
                    {prodReport.defectCauseAnalysis
                      ? String(prodReport.defectCauseAnalysis)
                      : "—"}
                  </DetailBlock>

                  <DetailBlock label="재발방지 대책" emphasize>
                    {prodReport.recurrencePreventionMeasures
                      ? String(prodReport.recurrencePreventionMeasures)
                      : "—"}
                  </DetailBlock>
                </div>
                {prodCausePhoto?.uploadedUrl ||
                prodCausePhoto?.externalUrl ? (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-zinc-500">
                      원인분석 참고사진
                    </div>
                    <div className="mt-2 space-y-3">
                      {prodCausePhoto.uploadedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prodCausePhoto.uploadedUrl}
                          alt="원인분석 참고"
                          className="max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                        />
                      ) : null}
                      {prodCausePhoto.externalUrl ? (
                        <div>
                          <a
                            href={prodCausePhoto.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-zinc-900 underline"
                          >
                            이미지 링크 열기
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prodCausePhoto.externalUrl}
                            alt="원인분석 참고 외부 이미지"
                            className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {prodRecurrencePhoto?.uploadedUrl ||
                prodRecurrencePhoto?.externalUrl ? (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-zinc-500">
                      재발방지 참고사진
                    </div>
                    <div className="mt-2 space-y-3">
                      {prodRecurrencePhoto.uploadedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={prodRecurrencePhoto.uploadedUrl}
                          alt="재발방지 참고"
                          className="max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                        />
                      ) : null}
                      {prodRecurrencePhoto.externalUrl ? (
                        <div>
                          <a
                            href={prodRecurrencePhoto.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-zinc-900 underline"
                          >
                            이미지 링크 열기
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={prodRecurrencePhoto.externalUrl}
                            alt="재발방지 참고 외부 이미지"
                            className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {String(form.type) === "COMPLAINT" && labReport ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                    4
                  </span>
                  <div className="text-sm font-semibold text-zinc-900">
                    연구소_처리보고서
                  </div>
                </div>
                <div className="space-y-3">
                  <InfoRow
                    columns={[
                      {
                        label: "담당자",
                        value: labReport.chargePerson
                          ? String(labReport.chargePerson)
                          : "—",
                        flex: "flex-1",
                      },
                      {
                        label: "원인분석일자",
                        value: labReport.causeAnalysisDate
                          ? formatKoreanDateCompact(labReport.causeAnalysisDate)
                          : "—",
                        flex: "flex-1",
                      },
                    ]}
                  />

                  <DetailBlock label="원인분석" emphasize>
                    {labReport.causeAnalysis
                      ? String(labReport.causeAnalysis)
                      : "—"}
                  </DetailBlock>

                  <DetailBlock label="재발방지대책" emphasize>
                    {labReport.recurrencePreventionMeasures
                      ? String(labReport.recurrencePreventionMeasures)
                      : "—"}
                  </DetailBlock>
                </div>
                {labCausePhoto?.uploadedUrl ||
                labCausePhoto?.externalUrl ? (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-zinc-500">
                      원인분석 참고사진
                    </div>
                    <div className="mt-2 space-y-3">
                      {labCausePhoto.uploadedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={labCausePhoto.uploadedUrl}
                          alt="연구소 원인분석 참고"
                          className="max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                        />
                      ) : null}
                      {labCausePhoto.externalUrl ? (
                        <div>
                          <a
                            href={labCausePhoto.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-zinc-900 underline"
                          >
                            이미지 링크 열기
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={labCausePhoto.externalUrl}
                            alt="연구소 원인분석 참고 외부 이미지"
                            className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
                {labRecurrencePhoto?.uploadedUrl ||
                labRecurrencePhoto?.externalUrl ? (
                  <div className="mt-3">
                    <div className="text-xs font-medium text-zinc-500">
                      재발방지대책 참고사진
                    </div>
                    <div className="mt-2 space-y-3">
                      {labRecurrencePhoto.uploadedUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={labRecurrencePhoto.uploadedUrl}
                          alt="연구소 재발방지대책 참고"
                          className="max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                        />
                      ) : null}
                      {labRecurrencePhoto.externalUrl ? (
                        <div>
                          <a
                            href={labRecurrencePhoto.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-medium text-zinc-900 underline"
                          >
                            이미지 링크 열기
                          </a>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={labRecurrencePhoto.externalUrl}
                            alt="연구소 재발방지대책 참고 외부 이미지"
                            className="mt-2 max-h-64 w-auto max-w-full rounded-lg border border-zinc-200"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}

            {String(form.type) === "COMPLAINT" && recoveryHandling ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/40 p-4 sm:p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-white">
                    5
                  </span>
                  <div className="text-sm font-semibold text-zinc-900">
                    회수품처리
                  </div>
                </div>
                <div className="space-y-3">
                  <InfoRow
                    columns={[
                      {
                        label: "처리일자",
                        value: recoveryHandling.processingDate
                          ? formatKoreanDateCompact(
                              recoveryHandling.processingDate
                            )
                          : "—",
                        flex: "flex-1",
                      },
                      {
                        label: "처리내용",
                        value: recoveryHandling.processingContent
                          ? String(recoveryHandling.processingContent)
                          : "—",
                        flex: "flex-[1.6]",
                      },
                    ]}
                  />

                  <DetailBlock label="처리 상세내용" emphasize>
                    {recoveryHandling.processingDetail
                      ? String(recoveryHandling.processingDetail)
                      : "—"}
                  </DetailBlock>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <CommentsPanel formId={form.id} comments={comments} />
      </div>
    </div>
  );
}

