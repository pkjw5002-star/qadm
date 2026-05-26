/** 서식 사진: file input name → URL input name */
export const FORM_PHOTO_FIELD_PAIRS = [
  { fileField: "photoFile", urlField: "photoUrlDirect" },
  { fileField: "outsideAsPhotoFile", urlField: "outsideAsPhotoUrlDirect" },
  { fileField: "prodCauseRefPhotoFile", urlField: "prodCauseRefPhotoUrlDirect" },
  {
    fileField: "prodRecurrenceRefPhotoFile",
    urlField: "prodRecurrenceRefPhotoUrlDirect",
  },
  { fileField: "labCauseRefPhotoFile", urlField: "labCauseRefPhotoUrlDirect" },
  {
    fileField: "labRecurrenceRefPhotoFile",
    urlField: "labRecurrenceRefPhotoUrlDirect",
  },
  { fileField: "qiReceiptPhotoFile", urlField: "qiReceiptPhotoUrlDirect" },
  { fileField: "qiReviewPhotoFile", urlField: "qiReviewPhotoUrlDirect" },
  { fileField: "sgProposalPhotoFile", urlField: "sgProposalPhotoUrlDirect" },
  { fileField: "sgProcessingPhotoFile", urlField: "sgProcessingPhotoUrlDirect" },
  { fileField: "abReportPhotoFile", urlField: "abReportPhotoUrlDirect" },
  { fileField: "abHandlingPhotoFile", urlField: "abHandlingPhotoUrlDirect" },
] as const;
