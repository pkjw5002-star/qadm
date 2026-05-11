export type FormListColumnVariant =
  | "no"
  | "date"
  | "compact"
  | "text"
  | "comment";

export type FormListColumn = {
  id: string;
  label: string;
  defaultWidth: number;
  minWidth: number;
  variant: FormListColumnVariant;
};

export type FormListRow = {
  id: string;
  cells: Record<string, string>;
  commentLine?: string | null;
  commentTooltip?: string | null;
  /** 열별 링크: 있으면 해당 셀 본문이 이 href로 이동 (예: 불만 목록 → 수정 화면 앵커) */
  cellHref?: Partial<Record<string, string>>;
};
