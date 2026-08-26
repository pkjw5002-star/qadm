"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { saveComplaintPhotoUpload } from "@/lib/complaintPhotoUpload";
import {
  getNextAbnormalReportFormNo,
  getNextComplaintFormNo,
  getNextQualityImprovementFormNo,
  getNextSuggestionFormNo,
  getNextWorkCoopFormNo,
} from "@/lib/formNo";
import {
  assembleComplaintFormData,
  mergeComplaintPhotos,
  type PhotoRef,
  type RawComplaintPhotoAttachments,
} from "@/lib/complaintFormAssemble";
import { urlsToPhotoRef } from "@/lib/photoRef";
import { buildListSnapshot } from "@/lib/formListSnapshot";
import type { FormType } from "@/generated/prisma/client";
import { PRODUCT_CATEGORY_OPTIONS } from "@/lib/productCategory";

const productCategorySchema = z.enum(PRODUCT_CATEGORY_OPTIONS);
function revalidateAfterFormChange(formId: string) {
  revalidatePath("/forms");
  revalidatePath(`/forms/${formId}`);
  revalidatePath(`/forms/${formId}/edit`);
}

function listSnapshotField(
  type: FormType,
  data: unknown,
  title: string,
  authorName: string,
  createdAt: Date
): Prisma.InputJsonValue | undefined {
  const snap = buildListSnapshot({ type, data, title, authorName, createdAt });
  return snap ? (snap as Prisma.InputJsonValue) : undefined;
}

/** 빈 문자열·공백만 → undefined (탭 2~5 미작성 허용) */
const optionalTrimmedNonEmpty = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}, z.string().min(1).optional());

/** Zod 필드 키 → 화면 한글명 (필수 미입력 안내용) */
const FORM_FIELD_LABEL_KO: Record<string, string> = {
  type: "서식 종류 선택",
  title: "제목",
  receiptDate: "접수 일자",
  productCategory: "품목구분",
  complaintProductName: "불만신고 제품명",
  departmentOwnerOptionId: "해당부서 및 담당자",
  customerInfo: "고객정보",
  productAndComplaint: "세부품명 및 불만신고내용",
  productManufacturing: "불만제품 제조번호 / 제조일자 / 작업자",
  recoveryProcessingContent: "회수품처리 처리내용",
  recoveryProcessingDetail: "회수품처리 처리 상세내용",
  qiReceiptDate: "접수 일자",
  qiWriterName: "작성자",
  qiProductCategory: "품목구분",
  qiItemSpec: "의뢰품명/사양",
  qiRequestReasonDetails: "의뢰사유 및 세부 의뢰내용",
  qiReviewDepartmentOwner: "검토부서/담당자",
  qiReviewDate: "검토일자",
  qiConfirmDate: "확인날짜",
  qiConfirmContent: "확인내용",
  abReportDate: "신고(요청) 일자",
  abWriterName: "작성자",
  abProductCategory: "품목구분",
  abItemSpec: "품목/사양",
  abProblemAndRequest: "문제점 및 이상현상·협조요청 내용",
  abHandlingDepartmentOwner: "처리(수신)부서/담당자",
  abHandlingDate: "처리일자",
  abConfirmDate: "확인날짜",
  abConfirmContent: "확인내용",
  sgProposalDate: "작성일자",
  sgWriterName: "작성자",
  sgProposalContent: "제안내용",
  sgProposalEffect: "제안효과",
  sgReviewDate: "심사일",
  sgReviewerComment: "심사자 Comment 등",
  sgProcessingHandler: "처리자",
  sgProcessingPlannedDate: "처리(예정)일자",
  sgProcessingContent: "처리내용",
};

function fieldRequiredMessage(label: string): string {
  const trimmed = label.trim();
  const last = trimmed.charCodeAt(trimmed.length - 1);
  const hasBatchim =
    last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  const particle = hasBatchim ? "은" : "는";
  return `${trimmed}${particle} 필수입니다.`;
}

function formFieldsValidationMessage(error: z.ZodError): string {
  for (const issue of error.issues) {
    if (issue.code === "custom" && issue.message) {
      return issue.message;
    }
    const leaf = issue.path[issue.path.length - 1];
    if (leaf === "type") {
      return "서식 종류를 확인해 주세요.";
    }
    if (typeof leaf === "string") {
      const label = FORM_FIELD_LABEL_KO[leaf];
      if (label) {
        return fieldRequiredMessage(label);
      }
    }
  }
  return "필수 항목을 확인해 주세요.";
}

export type FormActionFailure = {
  ok: false;
  message: string;
  values?: Record<string, string>;
};

function formDataToValues(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}

function abLikeHandlingReport(d: {
  abHandlingDate?: string;
  abPlannedDateReason?: string;
  abCauseAndActionPrevention?: string;
}, handlingPhoto?: PhotoRef | null) {
  const hasHandling = Boolean(
    d.abHandlingDate ||
      d.abPlannedDateReason ||
      d.abCauseAndActionPrevention ||
      handlingPhoto
  );
  if (!hasHandling) return undefined;
  return {
    date: d.abHandlingDate ?? "",
    plannedDateReason: d.abPlannedDateReason ?? "",
    causeAndActionPrevention: d.abCauseAndActionPrevention ?? "",
    ...(handlingPhoto ? { photoAttachment: handlingPhoto } : {}),
  };
}

function formActionFailure(
  message: string,
  formData?: FormData
): FormActionFailure {
  return {
    ok: false,
    message,
    ...(formData ? { values: formDataToValues(formData) } : {}),
  };
}

const recoveryProcessingContentOptional = z.preprocess((v) => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === "" ? undefined : s;
}, z.enum(["현상태사용", "수리", "부품교체", "폐기", "기타"]).optional());

const ComplaintReceiptSchema = z.object({
  type: z.literal("COMPLAINT"),
  /** 1. 접수 — 필수 */
  receiptDate: z.string().min(1),
  productCategory: productCategorySchema,
  complaintProductName: z.string().min(1),
  departmentOwnerOptionId: z.string().min(1),
  customerInfo: z.string().min(1),
  productAndComplaint: z.string().min(1),
  productManufacturing: z.string().min(1),
  actionContent: z.string().optional(),
  /** 2~5탭 — 비우면 접수만 저장 */
  outsideAsDate: optionalTrimmedNonEmpty,
  outsideAsExecutor: optionalTrimmedNonEmpty,
  outsideAsPlace: optionalTrimmedNonEmpty,
  outsideAsDuration: optionalTrimmedNonEmpty,
  outsideAsContentResult: optionalTrimmedNonEmpty,
  prodDefectRecoveryDate: optionalTrimmedNonEmpty,
  prodCauseAnalysisDate: optionalTrimmedNonEmpty,
  prodRecoveredManufacturingInfo: optionalTrimmedNonEmpty,
  prodRecoveredOperationAppearance: optionalTrimmedNonEmpty,
  prodDefectCauseAnalysis: optionalTrimmedNonEmpty,
  prodRecurrencePrevention: optionalTrimmedNonEmpty,
  labChargePerson: optionalTrimmedNonEmpty,
  labCauseAnalysisDate: optionalTrimmedNonEmpty,
  labCauseAnalysis: optionalTrimmedNonEmpty,
  labRecurrencePrevention: optionalTrimmedNonEmpty,
  recoveryProcessingDate: optionalTrimmedNonEmpty,
  recoveryProcessingContent: recoveryProcessingContentOptional,
  recoveryProcessingDetail: optionalTrimmedNonEmpty,
}).superRefine((data, ctx) => {
  if (data.recoveryProcessingDate) {
    if (!data.recoveryProcessingContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "회수품처리의 처리내용을 선택해 주세요.",
        path: ["recoveryProcessingContent"],
      });
    }
    if (!data.recoveryProcessingDetail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "회수품처리의 처리 상세내용을 입력해 주세요.",
        path: ["recoveryProcessingDetail"],
      });
    }
  }
});

const QualityImprovementSchema = z
  .object({
    type: z.literal("QUALITY_IMPROVEMENT"),
    title: z.string().optional(),

    /** 1. 접수 — 필수 */
    qiReceiptDate: z.string().min(1),
    qiWriterName: z.string().min(1),
    qiProductCategory: productCategorySchema,
    qiItemSpec: z.string().min(1),
    qiRequestReasonDetails: z.string().min(1),
    qiReviewDepartmentOwner: z.string().min(1),

    /** 2. 검토 회신서 — 선택 */
    qiReviewDate: optionalTrimmedNonEmpty,
    qiReviewDecisionDateReason: optionalTrimmedNonEmpty,
    qiReviewImprovementContent: optionalTrimmedNonEmpty,

    /** 3. 의뢰자 확인 — 선택 */
    qiConfirmDate: optionalTrimmedNonEmpty,
    qiConfirmContent: optionalTrimmedNonEmpty,
  })
  .superRefine((d, ctx) => {
    const hasReview =
      Boolean(d.qiReviewDecisionDateReason) ||
      Boolean(d.qiReviewImprovementContent);
    if (hasReview && !d.qiReviewDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "검토 회신서의 검토일자를 입력해 주세요.",
        path: ["qiReviewDate"],
      });
    }

    // 날짜는 기본값(오늘)로 들어올 수 있어 "내용이 있을 때만" 의뢰자 확인을 활성화
    const hasConfirm = Boolean(d.qiConfirmContent);
    if (hasConfirm) {
      if (!d.qiConfirmDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "의뢰자 확인의 확인날짜를 입력해 주세요.",
          path: ["qiConfirmDate"],
        });
      }
      if (!d.qiConfirmContent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "의뢰자 확인의 확인내용을 입력해 주세요.",
          path: ["qiConfirmContent"],
        });
      }
    }
  });

function qualityImprovementTitle(d: {
  qiReceiptDate: string;
  qiItemSpec: string;
}) {
  const date = String(d.qiReceiptDate || "").trim();
  const item = String(d.qiItemSpec || "").trim();
  return `${date || "품질개선"} · ${item || "의뢰"}`.trim();
}

async function parseQualityImprovementPhotos(formData: FormData) {
  const receiptPhoto = await parsePhotoField(
    formData,
    "qiReceiptPhotoUrlDirect",
    "qiReceiptPhotoFile",
    "qiReceiptPhotoRemove"
  );
  if (receiptPhoto && typeof receiptPhoto === "object" && "error" in receiptPhoto) {
    return receiptPhoto;
  }
  const reviewPhoto = await parsePhotoField(
    formData,
    "qiReviewPhotoUrlDirect",
    "qiReviewPhotoFile",
    "qiReviewPhotoRemove"
  );
  if (reviewPhoto && typeof reviewPhoto === "object" && "error" in reviewPhoto) {
    return reviewPhoto;
  }

  return {
    receiptPhoto: receiptPhoto as PhotoRef | null | undefined,
    reviewPhoto: reviewPhoto as PhotoRef | null | undefined,
  };
}

async function parseAbnormalReportPhotos(formData: FormData) {
  const reportPhoto = await parsePhotoField(
    formData,
    "abReportPhotoUrlDirect",
    "abReportPhotoFile",
    "abReportPhotoRemove"
  );
  if (reportPhoto && typeof reportPhoto === "object" && "error" in reportPhoto) {
    return reportPhoto;
  }

  const handlingPhoto = await parsePhotoField(
    formData,
    "abHandlingPhotoUrlDirect",
    "abHandlingPhotoFile",
    "abHandlingPhotoRemove"
  );
  if (handlingPhoto && typeof handlingPhoto === "object" && "error" in handlingPhoto) {
    return handlingPhoto;
  }

  return {
    reportPhoto: reportPhoto as PhotoRef | null | undefined,
    handlingPhoto: handlingPhoto as PhotoRef | null | undefined,
  };
}

async function parseSuggestionPhotos(formData: FormData) {
  const proposalPhoto = await parsePhotoField(
    formData,
    "sgProposalPhotoUrlDirect",
    "sgProposalPhotoFile",
    "sgProposalPhotoRemove"
  );
  if (proposalPhoto && typeof proposalPhoto === "object" && "error" in proposalPhoto) {
    return proposalPhoto;
  }

  const processingPhoto = await parsePhotoField(
    formData,
    "sgProcessingPhotoUrlDirect",
    "sgProcessingPhotoFile",
    "sgProcessingPhotoRemove"
  );
  if (
    processingPhoto &&
    typeof processingPhoto === "object" &&
    "error" in processingPhoto
  ) {
    return processingPhoto;
  }

  return {
    proposalPhoto: proposalPhoto as PhotoRef | null | undefined,
    processingPhoto: processingPhoto as PhotoRef | null | undefined,
  };
}

const AbnormalReportSchema = z
  .object({
    type: z.literal("ABNORMAL_REPORT"),
    title: z.string().optional(),

    /** 1. 이상발생신고 — 필수 */
    abReportDate: z.string().min(1),
    abWriterName: z.string().min(1),
    abProductCategory: productCategorySchema,
    abItemSpec: z.string().min(1),
    abProblemAndRequest: z.string().min(1),
    abHandlingDepartmentOwner: z.string().min(1),

    /** 2. 처리보고서 — 선택 */
    abHandlingDate: optionalTrimmedNonEmpty,
    abPlannedDateReason: optionalTrimmedNonEmpty,
    abCauseAndActionPrevention: optionalTrimmedNonEmpty,

    /** 3. 신고자확인 — 선택 */
    abConfirmDate: optionalTrimmedNonEmpty,
    abConfirmContent: optionalTrimmedNonEmpty,
  })
  .superRefine((d, ctx) => {
    const hasHandling = Boolean(d.abPlannedDateReason) || Boolean(d.abCauseAndActionPrevention);
    if (hasHandling && !d.abHandlingDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "처리보고서의 처리일자를 입력해 주세요.",
        path: ["abHandlingDate"],
      });
    }

    // 날짜는 기본값(오늘)로 들어올 수 있어 "내용이 있을 때만" 신고자확인을 활성화
    const hasConfirm = Boolean(d.abConfirmContent);
    if (hasConfirm) {
      if (!d.abConfirmDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "신고자확인의 확인날짜를 입력해 주세요.",
          path: ["abConfirmDate"],
        });
      }
      if (!d.abConfirmContent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "신고자확인의 확인내용을 입력해 주세요.",
          path: ["abConfirmContent"],
        });
      }
    }
  });

const WorkCoopSchema = z
  .object({
    type: z.literal("WORK_COOP"),
    title: z.string().optional(),

    /** 1. 업무협조 — 필수 (필드명은 이상발생신고서와 동일) */
    abReportDate: z.string().min(1),
    abWriterName: z.string().min(1),
    abProductCategory: productCategorySchema,
    abItemSpec: z.string().min(1),
    abProblemAndRequest: z.string().min(1),
    abHandlingDepartmentOwner: z.string().min(1),

    /** 2. 처리보고서 — 선택 */
    abHandlingDate: optionalTrimmedNonEmpty,
    abPlannedDateReason: optionalTrimmedNonEmpty,
    abCauseAndActionPrevention: optionalTrimmedNonEmpty,

    /** 3. 확인 — 선택 */
    abConfirmDate: optionalTrimmedNonEmpty,
    abConfirmContent: optionalTrimmedNonEmpty,
  })
  .superRefine((d, ctx) => {
    const hasHandling =
      Boolean(d.abPlannedDateReason) || Boolean(d.abCauseAndActionPrevention);
    if (hasHandling && !d.abHandlingDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "처리보고서의 처리일자를 입력해 주세요.",
        path: ["abHandlingDate"],
      });
    }

    const hasConfirm = Boolean(d.abConfirmContent);
    if (hasConfirm) {
      if (!d.abConfirmDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "확인의 확인날짜를 입력해 주세요.",
          path: ["abConfirmDate"],
        });
      }
      if (!d.abConfirmContent) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "확인의 확인내용을 입력해 주세요.",
          path: ["abConfirmContent"],
        });
      }
    }
  });

const SuggestionSchema = z
  .object({
    type: z.literal("SUGGESTION"),
    title: z.string().optional(),

    /** 1. 제안서 — 필수 */
    sgProposalDate: z.string().min(1),
    sgWriterName: z.string().min(1),
    sgProposalContent: z.string().min(1),
    sgProposalEffect: z.string().min(1),

    /** 2. 심사결과서 — 선택 */
    sgReviewDate: optionalTrimmedNonEmpty,
    sgReviewerComment: optionalTrimmedNonEmpty,
    sgProcessingHandler: optionalTrimmedNonEmpty,
    sgProcessingPlannedDate: optionalTrimmedNonEmpty,
    sgProcessingContent: optionalTrimmedNonEmpty,
  })
  .superRefine((d, ctx) => {
    const hasReviewText =
      Boolean(d.sgReviewerComment) ||
      Boolean(d.sgProcessingHandler) ||
      Boolean(d.sgProcessingPlannedDate) ||
      Boolean(d.sgProcessingContent);
    if (hasReviewText && !d.sgReviewDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "심사결과서 항목을 입력한 경우 심사일을 입력해 주세요.",
        path: ["sgReviewDate"],
      });
    }
  });

const CreateFormSchema = z.discriminatedUnion("type", [
  ComplaintReceiptSchema,
  QualityImprovementSchema,
  AbnormalReportSchema,
  WorkCoopSchema,
  SuggestionSchema,
]);

async function parsePhotoField(
  formData: FormData,
  urlField: string,
  fileField: string,
  removeField: string
): Promise<PhotoRef | { error: string } | null | undefined> {
  if (formData.get(removeField) === "1") {
    return null;
  }

  const urlLines = [
    ...formData.getAll(urlField).map((v) => String(v).trim()),
    ...String(formData.get(`${urlField}Manual`) ?? "")
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean),
  ].filter(Boolean);

  const validatedUrls: string[] = [];
  for (const rawUrl of urlLines) {
    try {
      const u = new URL(rawUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") {
        return {
          error: "사진 링크는 http 또는 https 주소만 입력할 수 있습니다.",
        };
      }
      const normalized = u.toString();
      if (!validatedUrls.includes(normalized)) validatedUrls.push(normalized);
    } catch {
      return {
        error:
          "사진 링크 형식을 확인해 주세요. (예: https://example.com/image.png)",
      };
    }
  }

  const fileEntries = formData
    .getAll(fileField)
    .filter((e): e is File => e instanceof File && e.size > 0);

  const uploadedPaths: string[] = [];
  if (fileEntries.length > 0) {
    const results = await Promise.all(
      fileEntries.map((file) => saveComplaintPhotoUpload(file))
    );
    for (const saved of results) {
      if (!saved.ok) return { error: saved.message };
      uploadedPaths.push(saved.publicPath);
    }
  }

  const allUrls = [...validatedUrls, ...uploadedPaths];
  if (allUrls.length === 0) {
    return null;
  }
  return urlsToPhotoRef(allUrls);
}

async function parseComplaintPhotoAttachments(formData: FormData): Promise<
  RawComplaintPhotoAttachments | { error: string }
> {
  const receiptPhotos = await parsePhotoField(
    formData,
    "photoUrlDirect",
    "photoFile",
    "photoRemove"
  );
  if (receiptPhotos && typeof receiptPhotos === "object" && "error" in receiptPhotos) {
    return receiptPhotos;
  }

  const outsidePhotos = await parsePhotoField(
    formData,
    "outsideAsPhotoUrlDirect",
    "outsideAsPhotoFile",
    "outsideAsPhotoRemove"
  );
  if (outsidePhotos && typeof outsidePhotos === "object" && "error" in outsidePhotos) {
    return outsidePhotos;
  }

  const causeRefPhotos = await parsePhotoField(
    formData,
    "prodCauseRefPhotoUrlDirect",
    "prodCauseRefPhotoFile",
    "prodCauseRefPhotoRemove"
  );
  if (causeRefPhotos && typeof causeRefPhotos === "object" && "error" in causeRefPhotos) {
    return causeRefPhotos;
  }

  const recurrenceRefPhotos = await parsePhotoField(
    formData,
    "prodRecurrenceRefPhotoUrlDirect",
    "prodRecurrenceRefPhotoFile",
    "prodRecurrenceRefPhotoRemove"
  );
  if (
    recurrenceRefPhotos &&
    typeof recurrenceRefPhotos === "object" &&
    "error" in recurrenceRefPhotos
  ) {
    return recurrenceRefPhotos;
  }

  const labCauseRefPhotos = await parsePhotoField(
    formData,
    "labCauseRefPhotoUrlDirect",
    "labCauseRefPhotoFile",
    "labCauseRefPhotoRemove"
  );
  if (
    labCauseRefPhotos &&
    typeof labCauseRefPhotos === "object" &&
    "error" in labCauseRefPhotos
  ) {
    return labCauseRefPhotos;
  }

  const labRecurrenceRefPhotos = await parsePhotoField(
    formData,
    "labRecurrenceRefPhotoUrlDirect",
    "labRecurrenceRefPhotoFile",
    "labRecurrenceRefPhotoRemove"
  );
  if (
    labRecurrenceRefPhotos &&
    typeof labRecurrenceRefPhotos === "object" &&
    "error" in labRecurrenceRefPhotos
  ) {
    return labRecurrenceRefPhotos;
  }

  return {
    ...(receiptPhotos !== undefined
      ? { complaintPhotoAttachment: receiptPhotos }
      : {}),
    ...(outsidePhotos !== undefined
      ? { outsideAsPhotoAttachment: outsidePhotos }
      : {}),
    ...(causeRefPhotos !== undefined
      ? { causeAnalysisRefPhotoAttachment: causeRefPhotos }
      : {}),
    ...(recurrenceRefPhotos !== undefined
      ? { recurrencePreventionRefPhotoAttachment: recurrenceRefPhotos }
      : {}),
    ...(labCauseRefPhotos !== undefined
      ? { labCauseRefPhotoAttachment: labCauseRefPhotos }
      : {}),
    ...(labRecurrenceRefPhotos !== undefined
      ? { labRecurrenceRefPhotoAttachment: labRecurrenceRefPhotos }
      : {}),
  };
}

export async function createFormAction(_: unknown, formData: FormData) {
  const user = await requireUser();

  const parsed = CreateFormSchema.safeParse({
    type: String(formData.get("type") ?? ""),
    title: String(formData.get("title") ?? "") || undefined,

    // COMPLAINT - 접수 탭
    receiptDate: String(formData.get("receiptDate") ?? ""),
    productCategory: String(formData.get("productCategory") ?? ""),
    complaintProductName: String(formData.get("complaintProductName") ?? ""),
    departmentOwnerOptionId: String(formData.get("departmentOwnerOptionId") ?? ""),
    customerInfo: String(formData.get("customerInfo") ?? ""),
    productAndComplaint: String(formData.get("productAndComplaint") ?? ""),
    productManufacturing: String(formData.get("productManufacturing") ?? ""),
    actionContent: String(formData.get("actionContent") ?? "") || undefined,

    outsideAsDate: String(formData.get("outsideAsDate") ?? ""),
    outsideAsExecutor: String(formData.get("outsideAsExecutor") ?? ""),
    outsideAsPlace: String(formData.get("outsideAsPlace") ?? ""),
    outsideAsDuration: String(formData.get("outsideAsDuration") ?? ""),
    outsideAsContentResult: String(formData.get("outsideAsContentResult") ?? ""),

    prodDefectRecoveryDate: String(formData.get("prodDefectRecoveryDate") ?? ""),
    prodCauseAnalysisDate: String(formData.get("prodCauseAnalysisDate") ?? ""),
    prodRecoveredManufacturingInfo: String(
      formData.get("prodRecoveredManufacturingInfo") ?? ""
    ),
    prodRecoveredOperationAppearance: String(
      formData.get("prodRecoveredOperationAppearance") ?? ""
    ),
    prodDefectCauseAnalysis: String(formData.get("prodDefectCauseAnalysis") ?? ""),
    prodRecurrencePrevention: String(formData.get("prodRecurrencePrevention") ?? ""),

    labChargePerson: String(formData.get("labChargePerson") ?? ""),
    labCauseAnalysisDate: String(formData.get("labCauseAnalysisDate") ?? ""),
    labCauseAnalysis: String(formData.get("labCauseAnalysis") ?? ""),
    labRecurrencePrevention: String(formData.get("labRecurrencePrevention") ?? ""),

    recoveryProcessingDate: String(formData.get("recoveryProcessingDate") ?? ""),
    recoveryProcessingContent: String(
      formData.get("recoveryProcessingContent") ?? ""
    ),
    recoveryProcessingDetail: String(formData.get("recoveryProcessingDetail") ?? ""),

    // legacy fields (타 타입, 또는 기존 입력 방식)
    summary: String(formData.get("summary") ?? ""),
    details: String(formData.get("details") ?? "") || undefined,

    // QUALITY_IMPROVEMENT
    qiReceiptDate: String(formData.get("qiReceiptDate") ?? ""),
    qiWriterName: String(formData.get("qiWriterName") ?? ""),
    qiProductCategory: String(formData.get("qiProductCategory") ?? ""),
    qiItemSpec: String(formData.get("qiItemSpec") ?? ""),
    qiRequestReasonDetails: String(formData.get("qiRequestReasonDetails") ?? ""),
    qiReviewDepartmentOwner: String(formData.get("qiReviewDepartmentOwner") ?? ""),
    qiReviewDate: String(formData.get("qiReviewDate") ?? ""),
    qiReviewDecisionDateReason: String(formData.get("qiReviewDecisionDateReason") ?? ""),
    qiReviewImprovementContent: String(formData.get("qiReviewImprovementContent") ?? ""),
    qiConfirmDate: String(formData.get("qiConfirmDate") ?? ""),
    qiConfirmContent: String(formData.get("qiConfirmContent") ?? ""),

    // ABNORMAL_REPORT
    abReportDate: String(formData.get("abReportDate") ?? ""),
    abWriterName: String(formData.get("abWriterName") ?? ""),
    abProductCategory: String(formData.get("abProductCategory") ?? ""),
    abItemSpec: String(formData.get("abItemSpec") ?? ""),
    abProblemAndRequest: String(formData.get("abProblemAndRequest") ?? ""),
    abHandlingDepartmentOwner: String(formData.get("abHandlingDepartmentOwner") ?? ""),
    abHandlingDate: String(formData.get("abHandlingDate") ?? ""),
    abPlannedDateReason: String(formData.get("abPlannedDateReason") ?? ""),
    abCauseAndActionPrevention: String(formData.get("abCauseAndActionPrevention") ?? ""),
    abConfirmDate: String(formData.get("abConfirmDate") ?? ""),
    abConfirmContent: String(formData.get("abConfirmContent") ?? ""),

    // SUGGESTION (제안서)
    sgProposalDate: String(formData.get("sgProposalDate") ?? ""),
    sgWriterName: String(formData.get("sgWriterName") ?? ""),
    sgProposalContent: String(formData.get("sgProposalContent") ?? ""),
    sgProposalEffect: String(formData.get("sgProposalEffect") ?? ""),
    sgReviewDate: String(formData.get("sgReviewDate") ?? ""),
    sgReviewerComment: String(formData.get("sgReviewerComment") ?? ""),
    sgProcessingHandler: String(formData.get("sgProcessingHandler") ?? ""),
    sgProcessingPlannedDate: String(
      formData.get("sgProcessingPlannedDate") ?? ""
    ),
    sgProcessingContent: String(formData.get("sgProcessingContent") ?? ""),
  } as unknown);

  if (!parsed.success) {
    return formActionFailure(
      formFieldsValidationMessage(parsed.error),
      formData
    );
  }

  let rawAttachments: RawComplaintPhotoAttachments = {};
  if (parsed.data.type === "COMPLAINT") {
    const ph = await parseComplaintPhotoAttachments(formData);
    if ("error" in ph) return formActionFailure(ph.error, formData);
    rawAttachments = ph;
  }

  if (parsed.data.type === "COMPLAINT") {
    const opt = await prisma.departmentOwnerOption.findUnique({
      where: { id: parsed.data.departmentOwnerOptionId },
      select: { label: true },
    });
    if (!opt) return formActionFailure("부서/담당자 항목을 선택해 주세요.", formData);

    const d = parsed.data;

    let createdId: string;
    try {
      const row = await prisma.$transaction(async (tx) => {
        const formNo = await getNextComplaintFormNo(tx);
        const merged = mergeComplaintPhotos(undefined, rawAttachments);
        const data = assembleComplaintFormData(
          d,
          opt.label,
          formNo,
          merged
        ) as Prisma.InputJsonValue;

        return tx.form.create({
          data: {
            type: "COMPLAINT",
            title: formNo,
            status: "SUBMITTED",
            createdById: user.id,
            data,
            listSnapshot: listSnapshotField(
              "COMPLAINT",
              data,
              formNo,
              user.name,
              new Date()
            ),
            events: {
              create: {
                actorId: user.id,
                action: "CREATE",
                payload: { status: "SUBMITTED" },
              },
            },
          },
          select: { id: true },
        });
      });
      createdId = row.id;
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
      return formActionFailure(msg, formData);
    }

    revalidateAfterFormChange(createdId);
    redirect(`/forms/${createdId}`);
  }

  if (parsed.data.type === "QUALITY_IMPROVEMENT") {
    const photos = await parseQualityImprovementPhotos(formData);
    if ("error" in photos) return formActionFailure(photos.error, formData);

    const d = parsed.data;
    const formNo = await getNextQualityImprovementFormNo(prisma);
    const title = formNo;
    const hasReview = Boolean(
      d.qiReviewDecisionDateReason || d.qiReviewImprovementContent || photos.reviewPhoto
    );
    const hasConfirm = Boolean(d.qiConfirmContent);
    const data = {
      qualityImprovement: {
        formNo,
        receipt: {
          date: d.qiReceiptDate,
          writerName: d.qiWriterName,
          productCategory: d.qiProductCategory,
          itemSpec: d.qiItemSpec,
          requestReasonDetails: d.qiRequestReasonDetails,
          reviewDepartmentOwner: d.qiReviewDepartmentOwner,
          ...(photos.receiptPhoto ? { photoAttachment: photos.receiptPhoto } : {}),
        },
        review: hasReview && d.qiReviewDate
          ? {
              date: d.qiReviewDate,
              decisionDateReason: d.qiReviewDecisionDateReason ?? "",
              improvementContent: d.qiReviewImprovementContent ?? "",
              ...(photos.reviewPhoto ? { photoAttachment: photos.reviewPhoto } : {}),
            }
          : undefined,
        requesterConfirm: hasConfirm && d.qiConfirmDate
          ? {
              date: d.qiConfirmDate,
              content: d.qiConfirmContent ?? "",
            }
          : undefined,
      },
    } as Prisma.InputJsonValue;

    const created = await prisma.form.create({
      data: {
        type: "QUALITY_IMPROVEMENT",
        title,
        status: "SUBMITTED",
        createdById: user.id,
        data,
        listSnapshot: listSnapshotField(
          "QUALITY_IMPROVEMENT",
          data,
          title,
          user.name,
          new Date()
        ),
        events: {
          create: {
            actorId: user.id,
            action: "CREATE",
            payload: { status: "SUBMITTED" },
          },
        },
      },
      select: { id: true },
    });

    revalidateAfterFormChange(created.id);
    redirect(`/forms/${created.id}`);
  }

  if (parsed.data.type === "ABNORMAL_REPORT") {
    const photos = await parseAbnormalReportPhotos(formData);
    if ("error" in photos) return formActionFailure(photos.error, formData);

    const d = parsed.data;
    const formNo = await getNextAbnormalReportFormNo(prisma);
    const title = formNo;
    const hasConfirm = Boolean(d.abConfirmContent);

    const data = {
      abnormalReport: {
        formNo,
        report: {
          date: d.abReportDate,
          writerName: d.abWriterName,
          productCategory: d.abProductCategory,
          itemSpec: d.abItemSpec,
          problemAndRequest: d.abProblemAndRequest,
          handlingDepartmentOwner: d.abHandlingDepartmentOwner,
          ...(photos.reportPhoto ? { photoAttachment: photos.reportPhoto } : {}),
        },
        handlingReport: abLikeHandlingReport(d, photos.handlingPhoto),
        reporterConfirm:
          hasConfirm && d.abConfirmDate
            ? {
                date: d.abConfirmDate,
                content: d.abConfirmContent ?? "",
              }
            : undefined,
      },
    } as Prisma.InputJsonValue;

    const created = await prisma.form.create({
      data: {
        type: "ABNORMAL_REPORT",
        title,
        status: "SUBMITTED",
        createdById: user.id,
        data,
        listSnapshot: listSnapshotField(
          "ABNORMAL_REPORT",
          data,
          title,
          user.name,
          new Date()
        ),
        events: {
          create: {
            actorId: user.id,
            action: "CREATE",
            payload: { status: "SUBMITTED" },
          },
        },
      },
      select: { id: true },
    });

    revalidateAfterFormChange(created.id);
    redirect(`/forms/${created.id}`);
  }

  if (parsed.data.type === "WORK_COOP") {
    const photos = await parseAbnormalReportPhotos(formData);
    if ("error" in photos) return formActionFailure(photos.error, formData);

    const d = parsed.data;
    const formNo = await getNextWorkCoopFormNo(prisma);
    const title = formNo;
    const hasConfirm = Boolean(d.abConfirmContent);

    const data = {
      workCoop: {
        formNo,
        report: {
          date: d.abReportDate,
          writerName: d.abWriterName,
          productCategory: d.abProductCategory,
          itemSpec: d.abItemSpec,
          problemAndRequest: d.abProblemAndRequest,
          handlingDepartmentOwner: d.abHandlingDepartmentOwner,
          ...(photos.reportPhoto ? { photoAttachment: photos.reportPhoto } : {}),
        },
        handlingReport: abLikeHandlingReport(d, photos.handlingPhoto),
        reporterConfirm:
          hasConfirm && d.abConfirmDate
            ? {
                date: d.abConfirmDate,
                content: d.abConfirmContent ?? "",
              }
            : undefined,
      },
    } as Prisma.InputJsonValue;

    const created = await prisma.form.create({
      data: {
        type: "WORK_COOP",
        title,
        status: "SUBMITTED",
        createdById: user.id,
        data,
        listSnapshot: listSnapshotField(
          "WORK_COOP",
          data,
          title,
          user.name,
          new Date()
        ),
        events: {
          create: {
            actorId: user.id,
            action: "CREATE",
            payload: { status: "SUBMITTED" },
          },
        },
      },
      select: { id: true },
    });

    revalidateAfterFormChange(created.id);
    redirect(`/forms/${created.id}`);
  }

  if (parsed.data.type === "SUGGESTION") {
    const photos = await parseSuggestionPhotos(formData);
    if ("error" in photos) return formActionFailure(photos.error, formData);

    const d = parsed.data;

    if (photos.processingPhoto && !String(d.sgReviewDate ?? "").trim()) {
      return formActionFailure(
        "처리내용 사진을 첨부한 경우 심사일을 입력해 주세요.",
        formData
      );
    }

    const hasReviewResult = Boolean(
      String(d.sgReviewerComment ?? "").trim() ||
        String(d.sgProcessingHandler ?? "").trim() ||
        String(d.sgProcessingPlannedDate ?? "").trim() ||
        String(d.sgProcessingContent ?? "").trim() ||
        photos.processingPhoto
    );

    const formNo = await getNextSuggestionFormNo(prisma);
    const title = formNo;

    const data = {
      suggestion: {
        formNo,
        proposal: {
          date: d.sgProposalDate,
          writerName: d.sgWriterName,
          content: d.sgProposalContent,
          effect: d.sgProposalEffect,
          ...(photos.proposalPhoto
            ? { photoAttachment: photos.proposalPhoto }
            : {}),
        },
        reviewResult:
          hasReviewResult && String(d.sgReviewDate ?? "").trim()
            ? {
                reviewDate: String(d.sgReviewDate).trim(),
                reviewerCommentLine: d.sgReviewerComment ?? "",
                processingHandler: d.sgProcessingHandler ?? "",
                processingPlannedDate: d.sgProcessingPlannedDate ?? "",
                processingContent: d.sgProcessingContent ?? "",
                ...(photos.processingPhoto
                  ? { photoAttachment: photos.processingPhoto }
                  : {}),
              }
            : undefined,
      },
    } as Prisma.InputJsonValue;

    const created = await prisma.form.create({
      data: {
        type: "SUGGESTION",
        title,
        status: "SUBMITTED",
        createdById: user.id,
        data,
        listSnapshot: listSnapshotField(
          "SUGGESTION",
          data,
          title,
          user.name,
          new Date()
        ),
        events: {
          create: {
            actorId: user.id,
            action: "CREATE",
            payload: { status: "SUBMITTED" },
          },
        },
      },
      select: { id: true },
    });

    revalidateAfterFormChange(created.id);
    redirect(`/forms/${created.id}`);
  }

  return formActionFailure("지원하지 않는 서식 종류입니다.", formData);
}

function complaintFieldsFromFormData(formData: FormData) {
  return {
    type: "COMPLAINT" as const,
    receiptDate: String(formData.get("receiptDate") ?? ""),
    productCategory: String(formData.get("productCategory") ?? ""),
    complaintProductName: String(formData.get("complaintProductName") ?? ""),
    departmentOwnerOptionId: String(
      formData.get("departmentOwnerOptionId") ?? ""
    ),
    customerInfo: String(formData.get("customerInfo") ?? ""),
    productAndComplaint: String(formData.get("productAndComplaint") ?? ""),
    productManufacturing: String(formData.get("productManufacturing") ?? ""),
    actionContent: String(formData.get("actionContent") ?? "") || undefined,

    outsideAsDate: String(formData.get("outsideAsDate") ?? ""),
    outsideAsExecutor: String(formData.get("outsideAsExecutor") ?? ""),
    outsideAsPlace: String(formData.get("outsideAsPlace") ?? ""),
    outsideAsDuration: String(formData.get("outsideAsDuration") ?? ""),
    outsideAsContentResult: String(formData.get("outsideAsContentResult") ?? ""),

    prodDefectRecoveryDate: String(formData.get("prodDefectRecoveryDate") ?? ""),
    prodCauseAnalysisDate: String(formData.get("prodCauseAnalysisDate") ?? ""),
    prodRecoveredManufacturingInfo: String(
      formData.get("prodRecoveredManufacturingInfo") ?? ""
    ),
    prodRecoveredOperationAppearance: String(
      formData.get("prodRecoveredOperationAppearance") ?? ""
    ),
    prodDefectCauseAnalysis: String(formData.get("prodDefectCauseAnalysis") ?? ""),
    prodRecurrencePrevention: String(formData.get("prodRecurrencePrevention") ?? ""),

    labChargePerson: String(formData.get("labChargePerson") ?? ""),
    labCauseAnalysisDate: String(formData.get("labCauseAnalysisDate") ?? ""),
    labCauseAnalysis: String(formData.get("labCauseAnalysis") ?? ""),
    labRecurrencePrevention: String(formData.get("labRecurrencePrevention") ?? ""),

    recoveryProcessingDate: String(formData.get("recoveryProcessingDate") ?? ""),
    recoveryProcessingContent: String(
      formData.get("recoveryProcessingContent") ?? ""
    ),
    recoveryProcessingDetail: String(formData.get("recoveryProcessingDetail") ?? ""),
  };
}

export async function updateComplaintFormAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const formId = String(formData.get("formId") ?? "").trim();
  if (!formId) {
    return { ok: false as const, message: "서식 번호가 없습니다." };
  }

  const existing = await prisma.form.findUnique({ where: { id: formId } });
  if (!existing) {
    return { ok: false as const, message: "서식을 찾을 수 없습니다." };
  }
  if (existing.type !== "COMPLAINT") {
    return { ok: false as const, message: "불만신고서만 수정할 수 있습니다." };
  }

  const parsed = ComplaintReceiptSchema.safeParse(
    complaintFieldsFromFormData(formData)
  );
  if (!parsed.success) {
    return formActionFailure(
      formFieldsValidationMessage(parsed.error),
      formData
    );
  }

  const ph = await parseComplaintPhotoAttachments(formData);
  if ("error" in ph) return formActionFailure(ph.error, formData);

  const existingData = existing.data as Record<string, unknown>;
  const existingComplaint = existingData.complaint as
    | Record<string, unknown>
    | undefined;

  const opt = await prisma.departmentOwnerOption.findUnique({
    where: { id: parsed.data.departmentOwnerOptionId },
    select: { label: true },
  });
  if (!opt) {
    return formActionFailure("부서/담당자 항목을 선택해 주세요.", formData);
  }

  const formNo = String(
    (existingComplaint?.formNo as string | undefined) ?? existing.title
  );

  const merged = mergeComplaintPhotos(existingComplaint ?? null, ph);
  const data = assembleComplaintFormData(
    parsed.data,
    opt.label,
    formNo,
    merged
  ) as Prisma.InputJsonValue;

  try {
    await prisma.form.update({
      where: { id: formId },
      data: {
        data,
        listSnapshot: listSnapshotField(
          "COMPLAINT",
          data,
          formNo,
          user.name,
          existing.createdAt
        ),
        events: {
          create: {
            actorId: user.id,
            action: "UPDATE",
            payload: { status: String(existing.status) },
          },
        },
      },
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return formActionFailure(msg, formData);
  }

  revalidateAfterFormChange(formId);
  redirect(`/forms/${formId}`);
}

function pickPhoto(
  incoming: PhotoRef | null | undefined,
  existing: PhotoRef | undefined
): PhotoRef | undefined {
  if (incoming === null) return undefined;
  if (
    incoming?.uploadedUrl ||
    incoming?.externalUrl ||
    (incoming?.extraUploadedUrls?.length ?? 0) > 0
  ) {
    return incoming;
  }
  if (
    existing?.uploadedUrl ||
    existing?.externalUrl ||
    (existing?.extraUploadedUrls?.length ?? 0) > 0
  ) {
    return existing;
  }
  return undefined;
}

export async function updateQualityImprovementFormAction(
  _: unknown,
  formData: FormData
) {
  const user = await requireUser();
  const formId = String(formData.get("formId") ?? "").trim();
  if (!formId) {
    return { ok: false as const, message: "서식 번호가 없습니다." };
  }

  const existing = await prisma.form.findUnique({ where: { id: formId } });
  if (!existing) {
    return { ok: false as const, message: "서식을 찾을 수 없습니다." };
  }
  if (existing.type !== "QUALITY_IMPROVEMENT") {
    return { ok: false as const, message: "품질개선의뢰서만 수정할 수 있습니다." };
  }

  const parsed = QualityImprovementSchema.safeParse({
    type: "QUALITY_IMPROVEMENT",
    title: String(formData.get("title") ?? "") || undefined,
    qiReceiptDate: String(formData.get("qiReceiptDate") ?? ""),
    qiWriterName: String(formData.get("qiWriterName") ?? ""),
    qiProductCategory: String(formData.get("qiProductCategory") ?? ""),
    qiItemSpec: String(formData.get("qiItemSpec") ?? ""),
    qiRequestReasonDetails: String(formData.get("qiRequestReasonDetails") ?? ""),
    qiReviewDepartmentOwner: String(formData.get("qiReviewDepartmentOwner") ?? ""),
    qiReviewDate: String(formData.get("qiReviewDate") ?? ""),
    qiReviewDecisionDateReason: String(
      formData.get("qiReviewDecisionDateReason") ?? ""
    ),
    qiReviewImprovementContent: String(
      formData.get("qiReviewImprovementContent") ?? ""
    ),
    qiConfirmDate: String(formData.get("qiConfirmDate") ?? ""),
    qiConfirmContent: String(formData.get("qiConfirmContent") ?? ""),
  } as unknown);
  if (!parsed.success) {
    return formActionFailure(
      formFieldsValidationMessage(parsed.error),
      formData
    );
  }

  const photos = await parseQualityImprovementPhotos(formData);
  if ("error" in photos) return formActionFailure(photos.error, formData);

  const existingData = existing.data as {
    qualityImprovement?: {
      formNo?: unknown;
      receipt?: { photoAttachment?: PhotoRef };
      review?: { photoAttachment?: PhotoRef };
    };
  };
  const existingQi = existingData.qualityImprovement;

  const receiptPhoto = pickPhoto(
    photos.receiptPhoto,
    existingQi?.receipt?.photoAttachment
  );
  const reviewPhoto = pickPhoto(
    photos.reviewPhoto,
    existingQi?.review?.photoAttachment
  );

  const d = parsed.data;
  const existingNo =
    existingQi?.formNo != null ? String(existingQi.formNo) : existing.title;
  const title = existingNo || existing.title || qualityImprovementTitle(d);
  const hasReview = Boolean(
    d.qiReviewDecisionDateReason || d.qiReviewImprovementContent || reviewPhoto
  );
  const hasConfirm = Boolean(d.qiConfirmContent);
  const data = {
    qualityImprovement: {
      formNo: title,
      receipt: {
        date: d.qiReceiptDate,
        writerName: d.qiWriterName,
        productCategory: d.qiProductCategory,
        itemSpec: d.qiItemSpec,
        requestReasonDetails: d.qiRequestReasonDetails,
        reviewDepartmentOwner: d.qiReviewDepartmentOwner,
        ...(receiptPhoto ? { photoAttachment: receiptPhoto } : {}),
      },
      review: hasReview && d.qiReviewDate
        ? {
            date: d.qiReviewDate,
            decisionDateReason: d.qiReviewDecisionDateReason ?? "",
            improvementContent: d.qiReviewImprovementContent ?? "",
            ...(reviewPhoto ? { photoAttachment: reviewPhoto } : {}),
          }
        : undefined,
      requesterConfirm: hasConfirm && d.qiConfirmDate
        ? {
            date: d.qiConfirmDate,
            content: d.qiConfirmContent ?? "",
          }
        : undefined,
    },
  } as Prisma.InputJsonValue;

  try {
    await prisma.form.update({
      where: { id: formId },
      data: {
        title,
        data,
        listSnapshot: listSnapshotField(
          "QUALITY_IMPROVEMENT",
          data,
          title,
          user.name,
          existing.createdAt
        ),
        events: {
          create: {
            actorId: user.id,
            action: "UPDATE",
            payload: { status: String(existing.status) },
          },
        },
      },
    });
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return formActionFailure(msg, formData);
  }

  revalidateAfterFormChange(formId);
  redirect(`/forms/${formId}`);
}

export async function updateAbnormalReportFormAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const formId = String(formData.get("formId") ?? "").trim();
  if (!formId) {
    return { ok: false as const, message: "서식 번호가 없습니다." };
  }

  const existing = await prisma.form.findUnique({ where: { id: formId } });
  if (!existing) {
    return { ok: false as const, message: "서식을 찾을 수 없습니다." };
  }
  if (existing.type !== "ABNORMAL_REPORT") {
    return { ok: false as const, message: "이상발생신고서만 수정할 수 있습니다." };
  }

  const parsed = AbnormalReportSchema.safeParse({
    type: "ABNORMAL_REPORT",
    title: String(formData.get("title") ?? "") || undefined,
    abReportDate: String(formData.get("abReportDate") ?? ""),
    abWriterName: String(formData.get("abWriterName") ?? ""),
    abProductCategory: String(formData.get("abProductCategory") ?? ""),
    abItemSpec: String(formData.get("abItemSpec") ?? ""),
    abProblemAndRequest: String(formData.get("abProblemAndRequest") ?? ""),
    abHandlingDepartmentOwner: String(formData.get("abHandlingDepartmentOwner") ?? ""),
    abHandlingDate: String(formData.get("abHandlingDate") ?? ""),
    abPlannedDateReason: String(formData.get("abPlannedDateReason") ?? ""),
    abCauseAndActionPrevention: String(formData.get("abCauseAndActionPrevention") ?? ""),
    abConfirmDate: String(formData.get("abConfirmDate") ?? ""),
    abConfirmContent: String(formData.get("abConfirmContent") ?? ""),
  } as unknown);
  if (!parsed.success) {
    return formActionFailure(
      formFieldsValidationMessage(parsed.error),
      formData
    );
  }

  const photos = await parseAbnormalReportPhotos(formData);
  if ("error" in photos) return formActionFailure(photos.error, formData);

  const existingData = existing.data as {
    abnormalReport?: {
      formNo?: unknown;
      report?: { photoAttachment?: PhotoRef };
      handlingReport?: { photoAttachment?: PhotoRef };
    };
  };
  const existingAb = existingData.abnormalReport;

  const reportPhoto = pickPhoto(
    photos.reportPhoto,
    existingAb?.report?.photoAttachment
  );
  const handlingPhoto = pickPhoto(
    photos.handlingPhoto,
    existingAb?.handlingReport?.photoAttachment
  );

  const d = parsed.data;
  const existingNo =
    existingAb?.formNo != null ? String(existingAb.formNo) : existing.title;
  const title = existingNo || existing.title;
  const hasConfirm = Boolean(d.abConfirmContent);

  const data = {
    abnormalReport: {
      formNo: title,
      report: {
        date: d.abReportDate,
        writerName: d.abWriterName,
        productCategory: d.abProductCategory,
        itemSpec: d.abItemSpec,
        problemAndRequest: d.abProblemAndRequest,
        handlingDepartmentOwner: d.abHandlingDepartmentOwner,
        ...(reportPhoto ? { photoAttachment: reportPhoto } : {}),
      },
      handlingReport: abLikeHandlingReport(d, handlingPhoto),
      reporterConfirm:
        hasConfirm && d.abConfirmDate
          ? {
              date: d.abConfirmDate,
              content: d.abConfirmContent ?? "",
            }
          : undefined,
    },
  } as Prisma.InputJsonValue;

  try {
    await prisma.form.update({
      where: { id: formId },
      data: {
        title,
        data,
        listSnapshot: listSnapshotField(
          "ABNORMAL_REPORT",
          data,
          title,
          user.name,
          existing.createdAt
        ),
        events: {
          create: {
            actorId: user.id,
            action: "UPDATE",
            payload: { status: String(existing.status) },
          },
        },
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return formActionFailure(msg, formData);
  }

  revalidateAfterFormChange(formId);
  redirect(`/forms/${formId}`);
}

export async function updateWorkCoopFormAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const formId = String(formData.get("formId") ?? "").trim();
  if (!formId) {
    return { ok: false as const, message: "서식 번호가 없습니다." };
  }

  const existing = await prisma.form.findUnique({ where: { id: formId } });
  if (!existing) {
    return { ok: false as const, message: "서식을 찾을 수 없습니다." };
  }
  if (existing.type !== "WORK_COOP") {
    return { ok: false as const, message: "업무협조전만 수정할 수 있습니다." };
  }

  const parsed = WorkCoopSchema.safeParse({
    type: "WORK_COOP",
    title: String(formData.get("title") ?? "") || undefined,
    abReportDate: String(formData.get("abReportDate") ?? ""),
    abWriterName: String(formData.get("abWriterName") ?? ""),
    abProductCategory: String(formData.get("abProductCategory") ?? ""),
    abItemSpec: String(formData.get("abItemSpec") ?? ""),
    abProblemAndRequest: String(formData.get("abProblemAndRequest") ?? ""),
    abHandlingDepartmentOwner: String(
      formData.get("abHandlingDepartmentOwner") ?? ""
    ),
    abHandlingDate: String(formData.get("abHandlingDate") ?? ""),
    abPlannedDateReason: String(formData.get("abPlannedDateReason") ?? ""),
    abCauseAndActionPrevention: String(
      formData.get("abCauseAndActionPrevention") ?? ""
    ),
    abConfirmDate: String(formData.get("abConfirmDate") ?? ""),
    abConfirmContent: String(formData.get("abConfirmContent") ?? ""),
  } as unknown);
  if (!parsed.success) {
    return formActionFailure(
      formFieldsValidationMessage(parsed.error),
      formData
    );
  }

  const photos = await parseAbnormalReportPhotos(formData);
  if ("error" in photos) return formActionFailure(photos.error, formData);

  const existingData = existing.data as {
    workCoop?: {
      formNo?: unknown;
      report?: { photoAttachment?: PhotoRef };
      handlingReport?: { photoAttachment?: PhotoRef };
    };
  };
  const existingWc = existingData.workCoop;

  const reportPhoto = pickPhoto(
    photos.reportPhoto,
    existingWc?.report?.photoAttachment
  );
  const handlingPhoto = pickPhoto(
    photos.handlingPhoto,
    existingWc?.handlingReport?.photoAttachment
  );

  const d = parsed.data;
  const existingNo =
    existingWc?.formNo != null ? String(existingWc.formNo) : existing.title;
  const title = existingNo || existing.title;
  const hasConfirm = Boolean(d.abConfirmContent);

  const data = {
    workCoop: {
      formNo: title,
      report: {
        date: d.abReportDate,
        writerName: d.abWriterName,
        productCategory: d.abProductCategory,
        itemSpec: d.abItemSpec,
        problemAndRequest: d.abProblemAndRequest,
        handlingDepartmentOwner: d.abHandlingDepartmentOwner,
        ...(reportPhoto ? { photoAttachment: reportPhoto } : {}),
      },
      handlingReport: abLikeHandlingReport(d, handlingPhoto),
      reporterConfirm:
        hasConfirm && d.abConfirmDate
          ? {
              date: d.abConfirmDate,
              content: d.abConfirmContent ?? "",
            }
          : undefined,
    },
  } as Prisma.InputJsonValue;

  try {
    await prisma.form.update({
      where: { id: formId },
      data: {
        title,
        data,
        listSnapshot: listSnapshotField(
          "WORK_COOP",
          data,
          title,
          user.name,
          existing.createdAt
        ),
        events: {
          create: {
            actorId: user.id,
            action: "UPDATE",
            payload: { status: String(existing.status) },
          },
        },
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return formActionFailure(msg, formData);
  }

  revalidateAfterFormChange(formId);
  redirect(`/forms/${formId}`);
}

export async function updateSuggestionFormAction(_: unknown, formData: FormData) {
  const user = await requireUser();
  const formId = String(formData.get("formId") ?? "").trim();
  if (!formId) {
    return { ok: false as const, message: "서식 번호가 없습니다." };
  }

  const existing = await prisma.form.findUnique({ where: { id: formId } });
  if (!existing) {
    return { ok: false as const, message: "서식을 찾을 수 없습니다." };
  }
  if (existing.type !== "SUGGESTION") {
    return { ok: false as const, message: "제안서만 수정할 수 있습니다." };
  }

  const parsed = SuggestionSchema.safeParse({
    type: "SUGGESTION",
    title: String(formData.get("title") ?? "") || undefined,
    sgProposalDate: String(formData.get("sgProposalDate") ?? ""),
    sgWriterName: String(formData.get("sgWriterName") ?? ""),
    sgProposalContent: String(formData.get("sgProposalContent") ?? ""),
    sgProposalEffect: String(formData.get("sgProposalEffect") ?? ""),
    sgReviewDate: String(formData.get("sgReviewDate") ?? ""),
    sgReviewerComment: String(formData.get("sgReviewerComment") ?? ""),
    sgProcessingHandler: String(formData.get("sgProcessingHandler") ?? ""),
    sgProcessingPlannedDate: String(
      formData.get("sgProcessingPlannedDate") ?? ""
    ),
    sgProcessingContent: String(formData.get("sgProcessingContent") ?? ""),
  } as unknown);
  if (!parsed.success) {
    return formActionFailure(
      formFieldsValidationMessage(parsed.error),
      formData
    );
  }

  const photos = await parseSuggestionPhotos(formData);
  if ("error" in photos) return formActionFailure(photos.error, formData);

  if (photos.processingPhoto && !String(parsed.data.sgReviewDate ?? "").trim()) {
    return formActionFailure(
      "처리내용 사진을 첨부한 경우 심사일을 입력해 주세요.",
      formData
    );
  }

  const existingData = existing.data as {
    suggestion?: {
      formNo?: unknown;
      proposal?: { photoAttachment?: PhotoRef };
      reviewResult?: { photoAttachment?: PhotoRef };
    };
  };
  const existingSg = existingData.suggestion;

  const proposalPhoto = pickPhoto(
    photos.proposalPhoto,
    existingSg?.proposal?.photoAttachment
  );
  const processingPhoto = pickPhoto(
    photos.processingPhoto,
    existingSg?.reviewResult?.photoAttachment
  );

  const d = parsed.data;
  const existingNo =
    existingSg?.formNo != null ? String(existingSg.formNo) : existing.title;
  const title = existingNo || existing.title;

  const hasReviewResult = Boolean(
    String(d.sgReviewerComment ?? "").trim() ||
      String(d.sgProcessingHandler ?? "").trim() ||
      String(d.sgProcessingPlannedDate ?? "").trim() ||
      String(d.sgProcessingContent ?? "").trim() ||
      processingPhoto
  );

  const data = {
    suggestion: {
      formNo: title,
      proposal: {
        date: d.sgProposalDate,
        writerName: d.sgWriterName,
        content: d.sgProposalContent,
        effect: d.sgProposalEffect,
        ...(proposalPhoto ? { photoAttachment: proposalPhoto } : {}),
      },
      reviewResult:
        hasReviewResult && String(d.sgReviewDate ?? "").trim()
          ? {
              reviewDate: String(d.sgReviewDate).trim(),
              reviewerCommentLine: d.sgReviewerComment ?? "",
              processingHandler: d.sgProcessingHandler ?? "",
              processingPlannedDate: d.sgProcessingPlannedDate ?? "",
              processingContent: d.sgProcessingContent ?? "",
              ...(processingPhoto ? { photoAttachment: processingPhoto } : {}),
            }
          : undefined,
    },
  } as Prisma.InputJsonValue;

  try {
    await prisma.form.update({
      where: { id: formId },
      data: {
        title,
        data,
        listSnapshot: listSnapshotField(
          "SUGGESTION",
          data,
          title,
          user.name,
          existing.createdAt
        ),
        events: {
          create: {
            actorId: user.id,
            action: "UPDATE",
            payload: { status: String(existing.status) },
          },
        },
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "저장 중 오류가 발생했습니다.";
    return formActionFailure(msg, formData);
  }

  revalidateAfterFormChange(formId);
  redirect(`/forms/${formId}`);
}
