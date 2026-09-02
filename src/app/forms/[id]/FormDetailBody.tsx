import Link from "next/link";
import { preload } from "react-dom";
import FormPhotoGallery from "@/components/FormPhotoGallery";
import { heroFormPhotoUrls } from "@/lib/collectFormPhotoUrls";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formListHref } from "@/lib/formTypes";
import DeleteFormForm from "@/app/forms/[id]/DeleteFormForm";
import MarkFormReadOnMount from "@/app/forms/MarkFormReadOnMount";
import {
  CommentsPanelSkeleton,
  FormDetailComments,
} from "@/app/forms/[id]/FormDetailComments";

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
      <div className={emphasize ? "form-detail-display-emphasis" : "form-detail-display"}>
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
    <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-sm">
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

export async function FormDetailBody({ id }: { id: string }) {
  const user = await requireUser();

  const form = await prisma.form.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true } },
    },
  });
  if (!form) notFound();

  for (const url of heroFormPhotoUrls(form.type, form.data)) {
    preload(url, { as: "image" });
  }

  const data = form.data as {
    summary?: unknown;
    details?: unknown;
    qualityImprovement?: {
      formNo?: unknown;
      receipt?: {
        date?: unknown;
        writerName?: unknown;
        itemSpec?: unknown;
        productCategory?: unknown;
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
        productCategory?: unknown;
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
        productCategory?: unknown;
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
        processingHandler?: unknown;
        processingPlannedDate?: unknown;
        processingContent?: unknown;
        photoAttachment?: { uploadedUrl?: string; externalUrl?: string };
      };
    };
    complaint?: {
      formNo?: unknown;
      receipt?: {
        date?: unknown;
        productCategory?: unknown;
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

  const displayFormNo = (() => {
    const t = String(form.type);
    let raw: unknown;
    switch (t) {
      case "COMPLAINT":
        raw = data.complaint?.formNo;
        break;
      case "QUALITY_IMPROVEMENT":
        raw = data.qualityImprovement?.formNo;
        break;
      case "ABNORMAL_REPORT":
        raw = data.abnormalReport?.formNo;
        break;
      case "WORK_COOP":
        raw = data.workCoop?.formNo;
        break;
      case "SUGGESTION":
        raw = data.suggestion?.formNo;
        break;
      default:
        raw = undefined;
    }
    if (raw != null && String(raw).trim() !== "") return String(raw).trim();
    return form.title;
  })();

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">
            {displayFormNo}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {String(form.type) === "COMPLAINT" ||
          String(form.type) === "QUALITY_IMPROVEMENT" ||
          String(form.type) === "ABNORMAL_REPORT" ||
          String(form.type) === "WORK_COOP" ||
          String(form.type) === "SUGGESTION" ? (
            <>
              <Link
                className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                href={`/forms/${form.id}/edit`}
              >
                수정
              </Link>
              {user.role === "ADMIN" ? (
                <DeleteFormForm formId={form.id} />
              ) : null}
            </>
          ) : null}
          <Link
            className="text-sm font-medium text-zinc-900 underline"
            href={formListHref(form.type)}
          >
            목록
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,20rem)] xl:grid-cols-[minmax(0,1fr)_22rem] items-start">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-800 sm:px-5">
            내용
          </div>
          <div className="form-detail-surface space-y-6 bg-zinc-50 p-4 sm:p-6">
            {String(form.type) === "COMPLAINT" && receipt ? (
              <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-zinc-100 px-4 py-3 sm:px-5">
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
                        label: "품목구분",
                        value: receipt.productCategory
                          ? String(receipt.productCategory)
                          : "—",
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

                  <FormPhotoGallery
                    photo={photo}
                    label="사진첨부"
                    legacyNote={legacyPhotoNote}
                    hero
                  />

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
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                  <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-zinc-100 px-4 py-3 sm:px-5">
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
                          label: "품목구분",
                          value:
                            qi.receipt.productCategory != null &&
                            String(qi.receipt.productCategory).trim() !== ""
                              ? String(qi.receipt.productCategory)
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
                          flex: "flex-[1.5]",
                        },
                        {
                          label: "검토부서/담당자",
                          value:
                            qi.receipt.reviewDepartmentOwner != null &&
                            String(qi.receipt.reviewDepartmentOwner).trim() !== ""
                              ? String(qi.receipt.reviewDepartmentOwner)
                              : "—",
                          flex: "flex-[1.1]",
                        },
                      ]}
                    />

                    <DetailBlock label="의뢰사유 및 세부 의뢰내용" emphasize>
                      {qi.receipt.requestReasonDetails != null &&
                      String(qi.receipt.requestReasonDetails).trim() !== ""
                        ? String(qi.receipt.requestReasonDetails)
                        : "—"}
                    </DetailBlock>

                    <FormPhotoGallery
                      photo={qi.receipt.photoAttachment}
                      label="의뢰내용에 대한 사진 첨부"
                      hero
                    />
                  </div>
                </div>

                {qi.review ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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

                      <FormPhotoGallery
                        photo={qi.review.photoAttachment}
                        label="처리내용에 대한 사진 첨부"
                      />
                    </div>
                  </div>
                ) : null}

                {qi.requesterConfirm ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                  <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-zinc-100 px-4 py-3 sm:px-5">
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
                    <FormPhotoGallery
                      photo={sg.proposal.photoAttachment}
                      label="제안내용에 대한 사진 첨부"
                      hero
                    />
                  </div>
                </div>

                {sg.reviewResult ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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
                            label: "처리자",
                            value:
                              sg.reviewResult.processingHandler != null &&
                              String(sg.reviewResult.processingHandler).trim() !==
                                ""
                                ? String(sg.reviewResult.processingHandler)
                                : "—",
                            flex: "flex-1",
                          },
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
                      <FormPhotoGallery
                        photo={sg.reviewResult.photoAttachment}
                        label="처리내용에 대한 사진 첨부"
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : abLike?.report ? (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50">
                  <div className="flex flex-wrap items-center gap-3 border-b border-zinc-200/90 bg-zinc-100 px-4 py-3 sm:px-5">
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
                          label: "품목구분",
                          value:
                            abLike.report.productCategory != null &&
                            String(abLike.report.productCategory).trim() !== ""
                              ? String(abLike.report.productCategory)
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
                          flex: "flex-[1.5]",
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
                          flex: "flex-[1.1]",
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

                    <FormPhotoGallery
                      photo={abLike.report.photoAttachment}
                      label={
                        isWorkCoopDetail
                          ? "협조요청에 대한 사진 첨부"
                          : "이상현상 대한 사진 첨부"
                      }
                      hero
                    />
                  </div>
                </div>

                {abLike.handlingReport ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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

                      <FormPhotoGallery
                        photo={abLike.handlingReport.photoAttachment}
                        label={
                          isWorkCoopDetail
                            ? "처리내용에 대한 사진 첨부"
                            : "조치내용에 대한 사진 첨부"
                        }
                      />
                    </div>
                  </div>
                ) : null}

                {abLike.reporterConfirm ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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
              <div className="space-y-4 rounded-xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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
              <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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
                <div className="mt-3">
                  <div className="text-xs font-medium text-zinc-500">
                    사외AS시간
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-zinc-900">
                    {outsideAs.duration != null &&
                    String(outsideAs.duration).trim() !== ""
                      ? String(outsideAs.duration)
                      : "—"}
                  </div>
                </div>
                <FormPhotoGallery photo={outsidePhoto} label="관련사진" />
              </div>
            ) : null}

            {String(form.type) === "COMPLAINT" && prodReport ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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
                <FormPhotoGallery
                  photo={prodCausePhoto}
                  label="원인분석 참고사진"
                />
                <FormPhotoGallery
                  photo={prodRecurrencePhoto}
                  label="재발방지 참고사진"
                />
              </div>
            ) : null}

            {String(form.type) === "COMPLAINT" && labReport ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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
                <FormPhotoGallery
                  photo={labCausePhoto}
                  label="원인분석 참고사진"
                />
                <FormPhotoGallery
                  photo={labRecurrencePhoto}
                  label="재발방지대책 참고사진"
                />
              </div>
            ) : null}

            {String(form.type) === "COMPLAINT" && recoveryHandling ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-100/70 p-4 sm:p-5">
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

        <Suspense fallback={<CommentsPanelSkeleton />}>
          <FormDetailComments formId={form.id} />
        </Suspense>
      </div>
      <MarkFormReadOnMount formId={form.id} />
    </div>
  );
}

