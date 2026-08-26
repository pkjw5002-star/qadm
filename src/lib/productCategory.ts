/** 서식 공통 품목구분 (고정 선택) */
export const PRODUCT_CATEGORY_OPTIONS = [
  "지시계기",
  "디지털",
  "제어기",
  "변류기",
  "충전반",
  "EVSE",
  "그외",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORY_OPTIONS)[number];

export function isProductCategory(v: unknown): v is ProductCategory {
  return (
    typeof v === "string" &&
    (PRODUCT_CATEGORY_OPTIONS as readonly string[]).includes(v)
  );
}

export function formatProductWithCategory(
  category: unknown,
  productName: unknown
): string {
  const name =
    productName != null && String(productName).trim() !== ""
      ? String(productName).trim()
      : "";
  const cat =
    category != null && String(category).trim() !== ""
      ? String(category).trim()
      : "";
  if (cat && name) return `${cat} · ${name}`;
  return name || cat || "—";
}
