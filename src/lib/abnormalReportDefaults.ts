/** 이상발생신고서 수정 폼의 `defaultValue`용 플랫 필드 */
export type AbnormalReportDefaults = Partial<{
  abReportDate: string;
  abWriterName: string;
  abItemSpec: string;
  abProblemAndRequest: string;
  abHandlingDepartmentOwner: string;
  abReportPhotoUrlDirect: string;

  abHandlingDate: string;
  abPlannedDateReason: string;
  abCauseAndActionPrevention: string;
  abHandlingPhotoUrlDirect: string;

  abConfirmDate: string;
  abConfirmContent: string;
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
export function abnormalReportJsonToDefaults(data: unknown): AbnormalReportDefaults {
  const root = data as {
    abnormalReport?: {
      report?: Record<string, unknown>;
      handlingReport?: Record<string, unknown>;
      reporterConfirm?: Record<string, unknown>;
    };
  };
  const ab = root.abnormalReport;
  const r = ab?.report;
  const h = ab?.handlingReport;
  const c = ab?.reporterConfirm;

  const reportPhoto = r?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const handlingPhoto = h?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;

  return {
    abReportDate: dateInput(r?.date),
    abWriterName: r?.writerName != null ? String(r.writerName) : "",
    abItemSpec: r?.itemSpec != null ? String(r.itemSpec) : "",
    abProblemAndRequest:
      r?.problemAndRequest != null ? String(r.problemAndRequest) : "",
    abHandlingDepartmentOwner:
      r?.handlingDepartmentOwner != null
        ? String(r.handlingDepartmentOwner)
        : "",
    abReportPhotoUrlDirect: reportPhoto?.externalUrl ?? "",

    abHandlingDate: dateInput(h?.date),
    abPlannedDateReason:
      h?.plannedDateReason != null ? String(h.plannedDateReason) : "",
    abCauseAndActionPrevention:
      h?.causeAndActionPrevention != null
        ? String(h.causeAndActionPrevention)
        : "",
    abHandlingPhotoUrlDirect: handlingPhoto?.externalUrl ?? "",

    abConfirmDate: dateInput(c?.date),
    abConfirmContent: c?.content != null ? String(c.content) : "",
  };
}

