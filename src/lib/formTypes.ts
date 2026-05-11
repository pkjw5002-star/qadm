export type FormTypeKey =
  | "COMPLAINT"
  | "QUALITY_IMPROVEMENT"
  | "ABNORMAL_REPORT"
  | "WORK_COOP"
  | "SUGGESTION";

export const FORM_TYPES: { key: FormTypeKey; label: string }[] = [
  { key: "COMPLAINT", label: "불만신고서" },
  { key: "QUALITY_IMPROVEMENT", label: "품질개선의뢰서" },
  { key: "ABNORMAL_REPORT", label: "이상발생신고서" },
  { key: "WORK_COOP", label: "업무협조전" },
  { key: "SUGGESTION", label: "제안서" },
];

export const FORM_TYPE_LABEL: Record<FormTypeKey, string> = FORM_TYPES.reduce(
  (acc, t) => {
    acc[t.key] = t.label;
    return acc;
  },
  {} as Record<FormTypeKey, string>
);

export function isFormTypeKey(v: unknown): v is FormTypeKey {
  return (
    v === "COMPLAINT" ||
    v === "QUALITY_IMPROVEMENT" ||
    v === "ABNORMAL_REPORT" ||
    v === "WORK_COOP" ||
    v === "SUGGESTION"
  );
}

