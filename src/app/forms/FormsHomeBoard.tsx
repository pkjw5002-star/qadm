"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FORM_TYPES, type FormTypeKey } from "@/lib/formTypes";
import type { RecentBoardRow } from "@/lib/formRecentBoard";
import {
  PRODUCT_CATEGORY_OPTIONS,
  type ProductCategory,
} from "@/lib/productCategory";
import {
  FORM_READ_CHANGED_EVENT,
  loadFormReadIds,
  loadFormReadIdsLocal,
} from "@/lib/formReadStore";

type SearchFilters = {
  formType: "" | FormTypeKey;
  dateFrom: string;
  dateTo: string;
  productCategory: "" | ProductCategory;
  author: string;
  content: string;
};

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultDateRange(): Pick<SearchFilters, "dateFrom" | "dateTo"> {
  const today = new Date();
  const from = new Date(today);
  from.setMonth(from.getMonth() - 6);
  return {
    dateFrom: toDateInputValue(from),
    dateTo: toDateInputValue(today),
  };
}

function createDefaultFilters(): SearchFilters {
  return {
    formType: "",
    ...defaultDateRange(),
    productCategory: "",
    author: "",
    content: "",
  };
}

function cellText(v: string): string {
  const t = v.trim();
  return t !== "" && t !== "—" ? t : "—";
}

function effectiveDateRange(filters: SearchFilters): {
  from: string;
  to: string;
} {
  const fromQ = filters.dateFrom.trim();
  const toQ = filters.dateTo.trim();
  if (!fromQ && !toQ) {
    const defaults = defaultDateRange();
    return { from: defaults.dateFrom, to: defaults.dateTo };
  }
  return { from: fromQ, to: toQ };
}

function matchesDateRange(
  docDateRaw: string,
  from: string,
  to: string
): boolean {
  if (!docDateRaw) return true;
  if (from && docDateRaw < from) return false;
  if (to && docDateRaw > to) return false;
  return true;
}

function FormsBoardTable({
  rows,
  readIds,
  emptyMessage,
}: {
  rows: RecentBoardRow[];
  readIds: Set<string>;
  emptyMessage: string;
}) {
  const cellBorder = "border-b border-zinc-200";

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[1080px] w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr className="bg-zinc-100 text-center text-xs font-medium text-zinc-700">
            <th className={`min-w-[110px] whitespace-nowrap px-3 py-2.5 ${cellBorder}`}>
              NO
            </th>
            <th className={`whitespace-nowrap px-3 py-2.5 ${cellBorder}`}>일자</th>
            <th className={`whitespace-nowrap px-3 py-2.5 ${cellBorder}`}>
              서류종류
            </th>
            <th className={`whitespace-nowrap px-3 py-2.5 ${cellBorder}`}>
              제품구분
            </th>
            <th className={`min-w-[120px] px-3 py-2.5 ${cellBorder}`}>제품명</th>
            <th className={`min-w-[180px] px-3 py-2.5 ${cellBorder}`}>내용</th>
            <th className={`min-w-[140px] px-3 py-2.5 ${cellBorder}`}>조치내용</th>
            <th className={`min-w-[140px] px-3 py-2.5 ${cellBorder}`}>
              원인분석 및 처리
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                className="px-4 py-10 text-center text-sm text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const read = readIds.has(row.id);
              const rowClass = read
                ? "font-normal text-zinc-500"
                : "font-bold text-zinc-900";
              const linkClass = read
                ? "text-zinc-500 hover:text-zinc-700"
                : "text-zinc-900 hover:text-sky-800";

              return (
                <tr key={row.id} className="hover:bg-zinc-50/80">
                  <td
                    className={`min-w-[110px] whitespace-nowrap px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}
                  >
                    <Link
                      href={`/forms/${row.id}`}
                      prefetch
                      className={`hover:underline ${linkClass}`}
                    >
                      {cellText(row.no)}
                    </Link>
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}
                  >
                    {cellText(row.docDate)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}
                  >
                    {row.formTypeLabel}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}
                  >
                    {cellText(row.productCategory)}
                  </td>
                  <td className={`px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}>
                    <div className="line-clamp-2 break-words whitespace-pre-wrap">
                      {cellText(row.productName)}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}>
                    <div className="line-clamp-3 break-words whitespace-pre-wrap">
                      {cellText(row.content)}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}>
                    <div className="line-clamp-3 break-words whitespace-pre-wrap">
                      {cellText(row.handlingContent)}
                    </div>
                  </td>
                  <td className={`px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}>
                    <div className="line-clamp-3 break-words whitespace-pre-wrap">
                      {cellText(row.causeAnalysis)}
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function FormsHomeBoard({
  rows,
  userId,
}: {
  rows: RecentBoardRow[];
  userId: string;
}) {
  const [filters, setFilters] = useState<SearchFilters>(createDefaultFilters);
  const [readIds, setReadIds] = useState<Set<string>>(() =>
    loadFormReadIdsLocal(userId)
  );
  const pathname = usePathname();

  const refreshReadIds = useCallback(() => {
    void loadFormReadIds(userId).then(setReadIds);
  }, [userId]);

  useEffect(() => {
    refreshReadIds();

    const onReadChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string }>).detail;
      if (detail?.userId !== userId) return;
      setReadIds(loadFormReadIdsLocal(userId));
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshReadIds();
    };

    window.addEventListener(FORM_READ_CHANGED_EVENT, onReadChanged);
    window.addEventListener("focus", refreshReadIds);
    window.addEventListener("pageshow", refreshReadIds);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(FORM_READ_CHANGED_EVENT, onReadChanged);
      window.removeEventListener("focus", refreshReadIds);
      window.removeEventListener("pageshow", refreshReadIds);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, refreshReadIds]);

  useEffect(() => {
    if (pathname === "/forms") refreshReadIds();
  }, [pathname, refreshReadIds]);

  const searchFiltered = useMemo(() => {
    const typeQ = filters.formType;
    const { from, to } = effectiveDateRange(filters);
    const categoryQ = filters.productCategory;
    const authorQ = filters.author.trim().toLowerCase();
    const contentQ = filters.content.trim().toLowerCase();

    return rows.filter((row) => {
      if (typeQ && row.formType !== typeQ) return false;
      if (!matchesDateRange(row.docDateRaw, from, to)) return false;
      if (categoryQ && row.productCategory !== categoryQ) return false;
      if (authorQ && !row.author.toLowerCase().includes(authorQ)) return false;
      if (contentQ) {
        const hay = `${row.content}\n${row.productName}\n${row.handlingContent}\n${row.causeAnalysis}`.toLowerCase();
        if (!hay.includes(contentQ)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const recentUnreadRows = useMemo(() => {
    const { dateFrom, dateTo } = defaultDateRange();
    return rows.filter((row) => {
      if (readIds.has(row.id)) return false;
      return matchesDateRange(row.docDateRaw, dateFrom, dateTo);
    });
  }, [rows, readIds]);

  const resetSearch = () => setFilters(createDefaultFilters());

  const searchEmptyMessage =
    rows.length === 0
      ? "아직 서식이 없어요. 우측 상단에서 서류작성을 눌러 보세요."
      : "검색 조건에 맞는 서식이 없습니다.";

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-800">
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-medium text-zinc-600">서류종류</span>
            <select
              value={filters.formType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  formType: e.target.value as SearchFilters["formType"],
                }))
              }
              className="min-w-[7rem] rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-400"
            >
              <option value="">전체</option>
              {FORM_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <div className="inline-flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-medium text-zinc-600">일자</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
              aria-label="시작일"
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-400"
            />
            <span className="text-zinc-400">~</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
              aria-label="종료일"
              className="rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-400"
            />
          </div>
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-medium text-zinc-600">제품구분</span>
            <select
              value={filters.productCategory}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  productCategory: e.target
                    .value as SearchFilters["productCategory"],
                }))
              }
              className="min-w-[6rem] rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-400"
            >
              <option value="">전체</option>
              {PRODUCT_CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-medium text-zinc-600">발행자</span>
            <input
              type="search"
              value={filters.author}
              onChange={(e) =>
                setFilters((f) => ({ ...f, author: e.target.value }))
              }
              placeholder="작성자"
              className="w-28 rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-400"
            />
          </label>
          <label className="inline-flex min-w-0 flex-1 items-center gap-1.5">
            <span className="shrink-0 font-medium text-zinc-600">내용</span>
            <input
              type="search"
              value={filters.content}
              onChange={(e) =>
                setFilters((f) => ({ ...f, content: e.target.value }))
              }
              placeholder="내용·제품명"
              className="min-w-[8rem] flex-1 rounded-lg border border-zinc-200 px-2 py-1 text-xs outline-none focus:border-zinc-400"
            />
          </label>
          <span className="shrink-0 text-zinc-500">
            {searchFiltered.length}건
          </span>
          <button
            type="button"
            onClick={resetSearch}
            className="shrink-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            초기화
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 bg-zinc-900 px-4 py-2 text-center sm:px-5">
          <h2 className="text-sm font-semibold text-white">검색 결과</h2>
        </div>
        <FormsBoardTable
          rows={searchFiltered}
          readIds={readIds}
          emptyMessage={searchEmptyMessage}
        />
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 bg-zinc-900 px-4 py-2 text-center sm:px-5">
          <h2 className="text-sm font-semibold text-white">최근게시판</h2>
        </div>
        <FormsBoardTable
          rows={recentUnreadRows}
          readIds={readIds}
          emptyMessage={
            rows.length === 0
              ? "아직 서식이 없어요. 우측 상단에서 서류작성을 눌러 보세요."
              : "안 읽은 글이 없습니다."
          }
        />
      </section>
    </div>
  );
}
