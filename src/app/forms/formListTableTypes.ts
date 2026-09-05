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
  /** 있으면 열 검색을 텍스트 입력 대신 선택으로 표시 */
  filterOptions?: readonly string[];
};

export type FormListRow = {
  id: string;
  cells: Record<string, string>;
  commentLine?: string | null;
  commentTooltip?: string | null;
  /** 열별 링크: 있으면 해당 셀 본문이 이 href로 이동 (예: 불만 목록 → 수정 화면 앵커) */
  cellHref?: Partial<Record<string, string>>;
  /** 미처리 등 강조: 행 본문을 파란색으로 표시 */
  highlightPending?: boolean;
  /** 불만 목록: 미회수 필터 */
  filterNotRecovered?: boolean;
  /** 불만 목록: 회수 후 미완료 필터 */
  filterRecoveredIncomplete?: boolean;
};
