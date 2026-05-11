export type PhotoRef = {
  uploadedUrl?: string;
  externalUrl?: string;
};

export type RawComplaintPhotoAttachments = {
  complaintPhotoAttachment?: PhotoRef;
  outsideAsPhotoAttachment?: PhotoRef;
  causeAnalysisRefPhotoAttachment?: PhotoRef;
  recurrencePreventionRefPhotoAttachment?: PhotoRef;
  labCauseRefPhotoAttachment?: PhotoRef;
  labRecurrenceRefPhotoAttachment?: PhotoRef;
};

export type MergedComplaintPhotos = {
  complaintPhoto?: PhotoRef;
  outsideAsPhoto?: PhotoRef;
  causeAnalysisRefPhoto?: PhotoRef;
  recurrencePreventionRefPhoto?: PhotoRef;
  labCauseRefPhoto?: PhotoRef;
  labRecurrenceRefPhoto?: PhotoRef;
};

export function pickPhoto(
  incoming: PhotoRef | undefined,
  existing: PhotoRef | undefined
): PhotoRef | undefined {
  if (incoming?.uploadedUrl || incoming?.externalUrl) return incoming;
  if (existing?.uploadedUrl || existing?.externalUrl) return existing;
  return undefined;
}

/** 수정 시 기존 JSON과 새로 파싱한 첨부를 합침 (새 파일/URL이 없으면 기존 유지) */
export function mergeComplaintPhotos(
  existingComplaint: Record<string, unknown> | null | undefined,
  raw: RawComplaintPhotoAttachments
): MergedComplaintPhotos {
  const ec = existingComplaint as {
    receipt?: { photoAttachment?: PhotoRef };
    outsideAs?: { photoAttachment?: PhotoRef };
    productionHandlingReport?: {
      causeAnalysisRefPhoto?: PhotoRef;
      recurrencePreventionRefPhoto?: PhotoRef;
    };
    researchLabHandlingReport?: {
      causeAnalysisRefPhoto?: PhotoRef;
      recurrencePreventionRefPhoto?: PhotoRef;
    };
  } | null;

  return {
    complaintPhoto: pickPhoto(
      raw.complaintPhotoAttachment,
      ec?.receipt?.photoAttachment
    ),
    outsideAsPhoto: pickPhoto(
      raw.outsideAsPhotoAttachment,
      ec?.outsideAs?.photoAttachment
    ),
    causeAnalysisRefPhoto: pickPhoto(
      raw.causeAnalysisRefPhotoAttachment,
      ec?.productionHandlingReport?.causeAnalysisRefPhoto
    ),
    recurrencePreventionRefPhoto: pickPhoto(
      raw.recurrencePreventionRefPhotoAttachment,
      ec?.productionHandlingReport?.recurrencePreventionRefPhoto
    ),
    labCauseRefPhoto: pickPhoto(
      raw.labCauseRefPhotoAttachment,
      ec?.researchLabHandlingReport?.causeAnalysisRefPhoto
    ),
    labRecurrenceRefPhoto: pickPhoto(
      raw.labRecurrenceRefPhotoAttachment,
      ec?.researchLabHandlingReport?.recurrencePreventionRefPhoto
    ),
  };
}

/** 불만신고서 `Form.data` 본문 조립 (생성·수정 공통) */
export function assembleComplaintFormData(
  d: {
    receiptDate: string;
    complaintProductName: string;
    departmentOwnerOptionId: string;
    customerInfo: string;
    productAndComplaint: string;
    productManufacturing: string;
    actionContent?: string;
    outsideAsDate?: string;
    outsideAsExecutor?: string;
    outsideAsPlace?: string;
    outsideAsDuration?: string;
    outsideAsContentResult?: string;
    prodDefectRecoveryDate?: string;
    prodCauseAnalysisDate?: string;
    prodRecoveredManufacturingInfo?: string;
    prodRecoveredOperationAppearance?: string;
    prodDefectCauseAnalysis?: string;
    prodRecurrencePrevention?: string;
    labChargePerson?: string;
    labCauseAnalysisDate?: string;
    labCauseAnalysis?: string;
    labRecurrencePrevention?: string;
    recoveryProcessingDate?: string;
    recoveryProcessingContent?: string;
    recoveryProcessingDetail?: string;
  },
  departmentAndOwnerLabel: string,
  formNo: string,
  merged: MergedComplaintPhotos
): Record<string, unknown> {
  const hasOutsideAsTab = Boolean(
    d.outsideAsDate ||
      d.outsideAsExecutor ||
      d.outsideAsPlace ||
      d.outsideAsDuration ||
      d.outsideAsContentResult ||
      merged.outsideAsPhoto
  );

  const outsideAs = hasOutsideAsTab
    ? {
        date: d.outsideAsDate ?? "",
        executor: d.outsideAsExecutor ?? "",
        place: d.outsideAsPlace ?? "",
        duration: d.outsideAsDuration ?? "",
        contentAndResult: d.outsideAsContentResult ?? "",
        ...(merged.outsideAsPhoto
          ? { photoAttachment: merged.outsideAsPhoto }
          : {}),
      }
    : undefined;

  const hasProductionTab = Boolean(
    d.prodDefectRecoveryDate ||
      d.prodCauseAnalysisDate ||
      d.prodRecoveredManufacturingInfo ||
      d.prodRecoveredOperationAppearance ||
      d.prodDefectCauseAnalysis ||
      d.prodRecurrencePrevention ||
      merged.causeAnalysisRefPhoto ||
      merged.recurrencePreventionRefPhoto
  );

  const productionHandlingReport = hasProductionTab
    ? {
        defectiveProductRecoveryDate: d.prodDefectRecoveryDate ?? "",
        causeAnalysisDate: d.prodCauseAnalysisDate ?? "",
        recoveredManufacturingInfo: d.prodRecoveredManufacturingInfo ?? "",
        recoveredOperationAndAppearanceDefect:
          d.prodRecoveredOperationAppearance ?? "",
        defectCauseAnalysis: d.prodDefectCauseAnalysis ?? "",
        ...(merged.causeAnalysisRefPhoto
          ? { causeAnalysisRefPhoto: merged.causeAnalysisRefPhoto }
          : {}),
        recurrencePreventionMeasures: d.prodRecurrencePrevention ?? "",
        ...(merged.recurrencePreventionRefPhoto
          ? {
              recurrencePreventionRefPhoto:
                merged.recurrencePreventionRefPhoto,
            }
          : {}),
      }
    : undefined;

  const hasResearchLabTab = Boolean(
    d.labChargePerson ||
      d.labCauseAnalysisDate ||
      d.labCauseAnalysis ||
      d.labRecurrencePrevention ||
      merged.labCauseRefPhoto ||
      merged.labRecurrenceRefPhoto
  );

  const researchLabHandlingReport = hasResearchLabTab
    ? {
        chargePerson: d.labChargePerson ?? "",
        causeAnalysisDate: d.labCauseAnalysisDate ?? "",
        causeAnalysis: d.labCauseAnalysis ?? "",
        ...(merged.labCauseRefPhoto
          ? { causeAnalysisRefPhoto: merged.labCauseRefPhoto }
          : {}),
        recurrencePreventionMeasures: d.labRecurrencePrevention ?? "",
        ...(merged.labRecurrenceRefPhoto
          ? {
              recurrencePreventionRefPhoto: merged.labRecurrenceRefPhoto,
            }
          : {}),
      }
    : undefined;

  const recoveredProductHandling = d.recoveryProcessingDate
    ? {
        processingDate: d.recoveryProcessingDate,
        processingContent: d.recoveryProcessingContent!,
        processingDetail: d.recoveryProcessingDetail!,
      }
    : undefined;

  return {
    summary: d.productAndComplaint,
    details: d.actionContent ?? "",
    complaint: {
      formNo,
      tabs: 6,
      receipt: {
        date: d.receiptDate,
        complaintProductName: d.complaintProductName,
        departmentOwnerOptionId: d.departmentOwnerOptionId,
        departmentAndOwner: departmentAndOwnerLabel,
        customerInfo: d.customerInfo,
        productAndComplaint: d.productAndComplaint,
        productManufacturing: d.productManufacturing,
        ...(merged.complaintPhoto
          ? { photoAttachment: merged.complaintPhoto }
          : {}),
        actionContent: d.actionContent ?? "",
      },
      ...(outsideAs ? { outsideAs } : {}),
      ...(productionHandlingReport ? { productionHandlingReport } : {}),
      ...(researchLabHandlingReport ? { researchLabHandlingReport } : {}),
      ...(recoveredProductHandling ? { recoveredProductHandling } : {}),
    },
  };
}
