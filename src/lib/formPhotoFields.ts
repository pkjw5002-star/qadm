/** 서식 사진: file / URL / 삭제 플래그 */
export const FORM_PHOTO_FIELD_PAIRS = [
  {
    fileField: "photoFile",
    urlField: "photoUrlDirect",
    removeField: "photoRemove",
  },
  {
    fileField: "outsideAsPhotoFile",
    urlField: "outsideAsPhotoUrlDirect",
    removeField: "outsideAsPhotoRemove",
  },
  {
    fileField: "prodCauseRefPhotoFile",
    urlField: "prodCauseRefPhotoUrlDirect",
    removeField: "prodCauseRefPhotoRemove",
  },
  {
    fileField: "prodRecurrenceRefPhotoFile",
    urlField: "prodRecurrenceRefPhotoUrlDirect",
    removeField: "prodRecurrenceRefPhotoRemove",
  },
  {
    fileField: "labCauseRefPhotoFile",
    urlField: "labCauseRefPhotoUrlDirect",
    removeField: "labCauseRefPhotoRemove",
  },
  {
    fileField: "labRecurrenceRefPhotoFile",
    urlField: "labRecurrenceRefPhotoUrlDirect",
    removeField: "labRecurrenceRefPhotoRemove",
  },
  {
    fileField: "qiReceiptPhotoFile",
    urlField: "qiReceiptPhotoUrlDirect",
    removeField: "qiReceiptPhotoRemove",
  },
  {
    fileField: "qiReviewPhotoFile",
    urlField: "qiReviewPhotoUrlDirect",
    removeField: "qiReviewPhotoRemove",
  },
  {
    fileField: "sgProposalPhotoFile",
    urlField: "sgProposalPhotoUrlDirect",
    removeField: "sgProposalPhotoRemove",
  },
  {
    fileField: "sgProcessingPhotoFile",
    urlField: "sgProcessingPhotoUrlDirect",
    removeField: "sgProcessingPhotoRemove",
  },
  {
    fileField: "abReportPhotoFile",
    urlField: "abReportPhotoUrlDirect",
    removeField: "abReportPhotoRemove",
  },
  {
    fileField: "abHandlingPhotoFile",
    urlField: "abHandlingPhotoUrlDirect",
    removeField: "abHandlingPhotoRemove",
  },
] as const;
