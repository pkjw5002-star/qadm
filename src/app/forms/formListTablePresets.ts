import type { FormListColumn } from "./formListTableTypes";

export const COMPLAINT_FORM_LIST_STORAGE_KEY = "qadm-complaint-list-table-v4";

export const COMPLAINT_FORM_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 72, minWidth: 48, variant: "no" },
  {
    id: "receiptDate",
    label: "접수일",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "customerInfo",
    label: "고객정보",
    defaultWidth: 180,
    minWidth: 96,
    variant: "text",
  },
  {
    id: "productName",
    label: "제품명",
    defaultWidth: 140,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "departmentOwner",
    label: "부서_담당자",
    defaultWidth: 200,
    minWidth: 120,
    variant: "text",
  },
  { id: "content", label: "내용", defaultWidth: 220, minWidth: 120, variant: "text" },
  {
    id: "actionContent",
    label: "조치내용",
    defaultWidth: 220,
    minWidth: 120,
    variant: "text",
  },
  {
    id: "outsideAs",
    label: "사외AS",
    defaultWidth: 96,
    minWidth: 72,
    variant: "compact",
  },
  {
    id: "causeAnalysis",
    label: "원인분석",
    defaultWidth: 104,
    minWidth: 88,
    variant: "compact",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 200,
    minWidth: 120,
    variant: "comment",
  },
];

export const QUALITY_IMPROVEMENT_LIST_STORAGE_KEY =
  "qadm-quality-improvement-list-table-v3";

export const QUALITY_IMPROVEMENT_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 72, minWidth: 48, variant: "no" },
  {
    id: "createdAt",
    label: "작성일",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "itemSpec",
    label: "의뢰품명/사양",
    defaultWidth: 160,
    minWidth: 120,
    variant: "text",
  },
  {
    id: "requestReason",
    label: "의뢰사유",
    defaultWidth: 160,
    minWidth: 96,
    variant: "text",
  },
  {
    id: "reviewDeptOwner",
    label: "검토부서/담당자",
    defaultWidth: 160,
    minWidth: 132,
    variant: "text",
  },
  {
    id: "reviewDate",
    label: "검토일자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "improvementContent",
    label: "검토(개선)처리 내용",
    defaultWidth: 200,
    minWidth: 168,
    variant: "text",
  },
  {
    id: "requesterConfirm",
    label: "의뢰자확인내용",
    defaultWidth: 160,
    minWidth: 120,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 200,
    minWidth: 120,
    variant: "comment",
  },
];

export const ABNORMAL_REPORT_LIST_STORAGE_KEY =
  "qadm-abnormal-report-list-table-v3";

export const ABNORMAL_REPORT_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 72, minWidth: 48, variant: "no" },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "reportDate",
    label: "신고일자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "itemSpec",
    label: "이상발생품명/사양",
    defaultWidth: 180,
    minWidth: 148,
    variant: "text",
  },
  {
    id: "problemAndRequest",
    label: "문제점 및 이상현상/요구사항",
    defaultWidth: 260,
    minWidth: 220,
    variant: "text",
  },
  {
    id: "handlingDeptOwner",
    label: "처리부서/담당자",
    defaultWidth: 160,
    minWidth: 132,
    variant: "text",
  },
  {
    id: "handlingDate",
    label: "처리일자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "causeAndAction",
    label: "원인 및 시정조치/예방",
    defaultWidth: 220,
    minWidth: 180,
    variant: "text",
  },
  {
    id: "reporterConfirm",
    label: "신고자확인내용",
    defaultWidth: 160,
    minWidth: 120,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 200,
    minWidth: 120,
    variant: "comment",
  },
];

export const WORK_COOP_LIST_STORAGE_KEY = "qadm-work-coop-list-table-v3";

export const WORK_COOP_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 72, minWidth: 48, variant: "no" },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "reportDate",
    label: "요청일자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "itemSpec",
    label: "요청품목/사양",
    defaultWidth: 160,
    minWidth: 120,
    variant: "text",
  },
  {
    id: "problemAndRequest",
    label: "협조요청내용 및 사유",
    defaultWidth: 220,
    minWidth: 176,
    variant: "text",
  },
  {
    id: "handlingDeptOwner",
    label: "수신부서/담당자",
    defaultWidth: 160,
    minWidth: 132,
    variant: "text",
  },
  {
    id: "handlingDate",
    label: "처리일자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "causeAndAction",
    label: "업무협조 처리내용",
    defaultWidth: 200,
    minWidth: 152,
    variant: "text",
  },
  {
    id: "reporterConfirm",
    label: "요청자확인내용",
    defaultWidth: 160,
    minWidth: 120,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 200,
    minWidth: 120,
    variant: "comment",
  },
];

export const SUGGESTION_LIST_STORAGE_KEY = "qadm-suggestion-list-table-v3";

export const SUGGESTION_LIST_COLUMNS: FormListColumn[] = [
  { id: "no", label: "NO", defaultWidth: 72, minWidth: 48, variant: "no" },
  {
    id: "createdAt",
    label: "작성일자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "author",
    label: "작성자",
    defaultWidth: 104,
    minWidth: 80,
    variant: "text",
  },
  {
    id: "proposalContent",
    label: "제안내용",
    defaultWidth: 180,
    minWidth: 96,
    variant: "text",
  },
  {
    id: "proposalEffect",
    label: "제안효과",
    defaultWidth: 160,
    minWidth: 96,
    variant: "text",
  },
  {
    id: "reviewDate",
    label: "심사일",
    defaultWidth: 104,
    minWidth: 80,
    variant: "date",
  },
  {
    id: "reviewerComment",
    label: "심사자 Comment 등",
    defaultWidth: 200,
    minWidth: 160,
    variant: "text",
  },
  {
    id: "processingHandler",
    label: "처리자",
    defaultWidth: 88,
    minWidth: 72,
    variant: "text",
  },
  {
    id: "processingPlannedDate",
    label: "처리(예정)일자",
    defaultWidth: 140,
    minWidth: 120,
    variant: "date",
  },
  {
    id: "processingContent",
    label: "처리내용",
    defaultWidth: 180,
    minWidth: 96,
    variant: "text",
  },
  {
    id: "comment",
    label: "댓글",
    defaultWidth: 200,
    minWidth: 120,
    variant: "comment",
  },
];
