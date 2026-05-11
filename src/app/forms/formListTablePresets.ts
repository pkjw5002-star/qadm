import type { FormListColumn } from "./formListTableTypes";

export const COMPLAINT_FORM_LIST_STORAGE_KEY = "qadm-complaint-list-table-v1";

export const COMPLAINT_FORM_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 56, minWidth: 40, variant: "no" },
  {
    id: "receiptDate",
    label: "접수일",
    defaultWidth: 80,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "customerInfo",
    label: "고객정보",
    defaultWidth: 100,
    minWidth: 64,
    variant: "text",
  },
  {
    id: "productName",
    label: "제품명",
    defaultWidth: 88,
    minWidth: 56,
    variant: "text",
  },
  {
    id: "departmentOwner",
    label: "부서_담당자",
    defaultWidth: 168,
    minWidth: 96,
    variant: "text",
  },
  { id: "content", label: "내용", defaultWidth: 144, minWidth: 80, variant: "text" },
  {
    id: "actionContent",
    label: "조치내용",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "outsideAsMeta",
    label: "사외AS일자및실시자",
    defaultWidth: 100,
    minWidth: 72,
    variant: "compact",
  },
  {
    id: "outsideAsContent",
    label: "사외AS내용",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "outsideAsTime",
    label: "사외AS시간",
    defaultWidth: 112,
    minWidth: 64,
    variant: "text",
  },
  {
    id: "recoveryDate",
    label: "회수일",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "causeAnalysisDate",
    label: "원인분석일자",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "defectPhenomenon",
    label: "불량현상",
    defaultWidth: 208,
    minWidth: 100,
    variant: "text",
  },
  {
    id: "defectCauseAnalysis",
    label: "불량원인분석",
    defaultWidth: 208,
    minWidth: 100,
    variant: "text",
  },
  {
    id: "recurrencePrevention",
    label: "재발방지대책",
    defaultWidth: 208,
    minWidth: 100,
    variant: "text",
  },
  {
    id: "recoveryHandling",
    label: "회수품처리내용",
    defaultWidth: 176,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 176,
    minWidth: 100,
    variant: "comment",
  },
];

export const QUALITY_IMPROVEMENT_LIST_STORAGE_KEY =
  "qadm-quality-improvement-list-table-v1";

export const QUALITY_IMPROVEMENT_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 56, minWidth: 40, variant: "no" },
  {
    id: "createdAt",
    label: "작성일",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 96,
    minWidth: 64,
    variant: "text",
  },
  {
    id: "itemSpec",
    label: "의뢰품명/사양",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "requestReason",
    label: "의뢰사유",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "reviewDeptOwner",
    label: "검토부서/담당자",
    defaultWidth: 128,
    minWidth: 72,
    variant: "text",
  },
  {
    id: "reviewDate",
    label: "검토일자",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "improvementContent",
    label: "검토(개선)처리 내용",
    defaultWidth: 176,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "requesterConfirm",
    label: "의뢰자확인내용",
    defaultWidth: 160,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 176,
    minWidth: 100,
    variant: "comment",
  },
];

export const ABNORMAL_REPORT_LIST_STORAGE_KEY =
  "qadm-abnormal-report-list-table-v1";

export const ABNORMAL_REPORT_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 56, minWidth: 40, variant: "no" },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 96,
    minWidth: 64,
    variant: "text",
  },
  {
    id: "reportDate",
    label: "신고일자",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "itemSpec",
    label: "이상발생품명/사양",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "problemAndRequest",
    label: "문제점 및 이상현상/요구사항",
    defaultWidth: 160,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "handlingDeptOwner",
    label: "처리부서/담당자",
    defaultWidth: 128,
    minWidth: 72,
    variant: "text",
  },
  {
    id: "handlingDate",
    label: "처리일자",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "causeAndAction",
    label: "원인 및 시정조치/예방",
    defaultWidth: 176,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "reporterConfirm",
    label: "신고자확인내용",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 176,
    minWidth: 100,
    variant: "comment",
  },
];

export const WORK_COOP_LIST_STORAGE_KEY = "qadm-work-coop-list-table-v1";

export const WORK_COOP_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 56, minWidth: 40, variant: "no" },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 96,
    minWidth: 64,
    variant: "text",
  },
  {
    id: "reportDate",
    label: "요청일자",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "itemSpec",
    label: "요청품목/사양",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "problemAndRequest",
    label: "협조요청내용 및 사유",
    defaultWidth: 160,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "handlingDeptOwner",
    label: "수신부서/담당자",
    defaultWidth: 128,
    minWidth: 72,
    variant: "text",
  },
  {
    id: "handlingDate",
    label: "처리일자",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "causeAndAction",
    label: "업무협조 처리내용",
    defaultWidth: 176,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "reporterConfirm",
    label: "요청자확인내용",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 176,
    minWidth: 100,
    variant: "comment",
  },
];

export const SUGGESTION_LIST_STORAGE_KEY = "qadm-suggestion-list-table-v1";

export const SUGGESTION_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 56, minWidth: 40, variant: "no" },
  {
    id: "createdAt",
    label: "작성일자",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 96,
    minWidth: 64,
    variant: "text",
  },
  {
    id: "proposalContent",
    label: "제안내용",
    defaultWidth: 160,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "proposalEffect",
    label: "제안효과",
    defaultWidth: 144,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "reviewDate",
    label: "심사일",
    defaultWidth: 88,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "reviewerComment",
    label: "심사자 Comment 등",
    defaultWidth: 160,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "processingPlannedDate",
    label: "처리(예정)일자",
    defaultWidth: 100,
    minWidth: 64,
    variant: "date",
  },
  {
    id: "processingContent",
    label: "처리내용",
    defaultWidth: 160,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 176,
    minWidth: 100,
    variant: "comment",
  },
];
