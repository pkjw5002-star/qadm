/** 부서/담당자 셀렉트 — 직접입력 선택값 */
export const DEPARTMENT_OWNER_DIRECT_ID = "__direct__";

const OTHER_LABELS = new Set(["기타", "직접입력"]);

export function selectableDepartmentOwnerOptions<
  T extends { id: string; label: string },
>(options: T[]): T[] {
  return options.filter((o) => !OTHER_LABELS.has(o.label.trim()));
}

export function isDepartmentOwnerDirectId(id: string): boolean {
  return id.trim() === DEPARTMENT_OWNER_DIRECT_ID;
}
