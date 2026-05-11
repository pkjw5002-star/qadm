/** 품질개선의뢰서 수정 폼의 `defaultValue`용 플랫 필드 */
export type QualityImprovementDefaults = Partial<{
  qiReceiptDate: string;
  qiWriterName: string;
  qiItemSpec: string;
  qiRequestReasonDetails: string;
  qiReviewDepartmentOwner: string;
  qiReceiptPhotoUrlDirect: string;

  qiReviewDate: string;
  qiReviewDecisionDateReason: string;
  qiReviewImprovementContent: string;
  qiReviewPhotoUrlDirect: string;

  qiConfirmDate: string;
  qiConfirmContent: string;
}>;

function dateInput(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  if (s === "") return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** DB `Form.data` JSON에서 수정 폼 기본값 추출 */
export function qualityImprovementJsonToDefaults(
  data: unknown
): QualityImprovementDefaults {
  const root = data as {
    qualityImprovement?: {
      receipt?: Record<string, unknown>;
      review?: Record<string, unknown>;
      requesterConfirm?: Record<string, unknown>;
    };
  };
  const qi = root.qualityImprovement;
  const r = qi?.receipt;
  const v = qi?.review;
  const c = qi?.requesterConfirm;

  const receiptPhoto = r?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const reviewPhoto = v?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;

  return {
    qiReceiptDate: dateInput(r?.date),
    qiWriterName: r?.writerName != null ? String(r.writerName) : "",
    qiItemSpec: r?.itemSpec != null ? String(r.itemSpec) : "",
    qiRequestReasonDetails:
      r?.requestReasonDetails != null ? String(r.requestReasonDetails) : "",
    qiReviewDepartmentOwner:
      r?.reviewDepartmentOwner != null ? String(r.reviewDepartmentOwner) : "",
    qiReceiptPhotoUrlDirect: receiptPhoto?.externalUrl ?? "",

    qiReviewDate: dateInput(v?.date),
    qiReviewDecisionDateReason:
      v?.decisionDateReason != null ? String(v.decisionDateReason) : "",
    qiReviewImprovementContent:
      v?.improvementContent != null ? String(v.improvementContent) : "",
    qiReviewPhotoUrlDirect: reviewPhoto?.externalUrl ?? "",

    qiConfirmDate: dateInput(c?.date),
    qiConfirmContent: c?.content != null ? String(c.content) : "",
  };
}

