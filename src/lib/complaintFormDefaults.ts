/** 불만신고서 수정 폼의 `defaultValue`용 플랫 필드 */
export type ComplaintFormDefaults = Partial<{
  receiptDate: string;
  complaintProductName: string;
  departmentOwnerOptionId: string;
  customerInfo: string;
  productAndComplaint: string;
  productManufacturing: string;
  actionContent: string;
  photoUrlDirect: string;
  outsideAsDate: string;
  outsideAsExecutor: string;
  outsideAsPlace: string;
  outsideAsDuration: string;
  outsideAsContentResult: string;
  outsideAsPhotoUrlDirect: string;
  prodDefectRecoveryDate: string;
  prodCauseAnalysisDate: string;
  prodRecoveredManufacturingInfo: string;
  prodRecoveredOperationAppearance: string;
  prodDefectCauseAnalysis: string;
  prodRecurrencePrevention: string;
  prodCauseRefPhotoUrlDirect: string;
  prodRecurrenceRefPhotoUrlDirect: string;
  labChargePerson: string;
  labCauseAnalysisDate: string;
  labCauseAnalysis: string;
  labRecurrencePrevention: string;
  labCauseRefPhotoUrlDirect: string;
  labRecurrenceRefPhotoUrlDirect: string;
  recoveryProcessingDate: string;
  recoveryProcessingContent: string;
  recoveryProcessingDetail: string;
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
export function complaintJsonToFormDefaults(data: unknown): ComplaintFormDefaults {
  const root = data as {
    complaint?: {
      receipt?: Record<string, unknown>;
      outsideAs?: Record<string, unknown>;
      productionHandlingReport?: Record<string, unknown>;
      researchLabHandlingReport?: Record<string, unknown>;
      recoveredProductHandling?: Record<string, unknown>;
    };
  };
  const c = root.complaint;
  const r = c?.receipt;
  const o = c?.outsideAs;
  const p = c?.productionHandlingReport;
  const l = c?.researchLabHandlingReport;
  const x = c?.recoveredProductHandling;

  const photo = r?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const outPh = o?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const pCausePh = p?.causeAnalysisRefPhoto as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const pRecPh = p?.recurrencePreventionRefPhoto as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const lCausePh = l?.causeAnalysisRefPhoto as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const lRecPh = l?.recurrencePreventionRefPhoto as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;

  return {
    receiptDate: dateInput(r?.date),
    complaintProductName: r?.complaintProductName != null ? String(r.complaintProductName) : "",
    departmentOwnerOptionId:
      r?.departmentOwnerOptionId != null
        ? String(r.departmentOwnerOptionId)
        : "",
    customerInfo: r?.customerInfo != null ? String(r.customerInfo) : "",
    productAndComplaint:
      r?.productAndComplaint != null ? String(r.productAndComplaint) : "",
    productManufacturing:
      r?.productManufacturing != null ? String(r.productManufacturing) : "",
    actionContent: r?.actionContent != null ? String(r.actionContent) : "",
    photoUrlDirect: photo?.externalUrl ?? "",
    outsideAsDate: dateInput(o?.date),
    outsideAsExecutor: o?.executor != null ? String(o.executor) : "",
    outsideAsPlace: o?.place != null ? String(o.place) : "",
    outsideAsDuration: o?.duration != null ? String(o.duration) : "",
    outsideAsContentResult:
      o?.contentAndResult != null ? String(o.contentAndResult) : "",
    outsideAsPhotoUrlDirect: outPh?.externalUrl ?? "",
    prodDefectRecoveryDate: dateInput(p?.defectiveProductRecoveryDate),
    prodCauseAnalysisDate: dateInput(p?.causeAnalysisDate),
    prodRecoveredManufacturingInfo:
      p?.recoveredManufacturingInfo != null
        ? String(p.recoveredManufacturingInfo)
        : "",
    prodRecoveredOperationAppearance:
      p?.recoveredOperationAndAppearanceDefect != null
        ? String(p.recoveredOperationAndAppearanceDefect)
        : "",
    prodDefectCauseAnalysis:
      p?.defectCauseAnalysis != null ? String(p.defectCauseAnalysis) : "",
    prodRecurrencePrevention:
      p?.recurrencePreventionMeasures != null
        ? String(p.recurrencePreventionMeasures)
        : "",
    prodCauseRefPhotoUrlDirect: pCausePh?.externalUrl ?? "",
    prodRecurrenceRefPhotoUrlDirect: pRecPh?.externalUrl ?? "",
    labChargePerson: l?.chargePerson != null ? String(l.chargePerson) : "",
    labCauseAnalysisDate: dateInput(l?.causeAnalysisDate),
    labCauseAnalysis: l?.causeAnalysis != null ? String(l.causeAnalysis) : "",
    labRecurrencePrevention:
      l?.recurrencePreventionMeasures != null
        ? String(l.recurrencePreventionMeasures)
        : "",
    labCauseRefPhotoUrlDirect: lCausePh?.externalUrl ?? "",
    labRecurrenceRefPhotoUrlDirect: lRecPh?.externalUrl ?? "",
    recoveryProcessingDate: dateInput(x?.processingDate),
    recoveryProcessingContent:
      x?.processingContent != null ? String(x.processingContent) : "",
    recoveryProcessingDetail:
      x?.processingDetail != null ? String(x.processingDetail) : "",
  };
}
