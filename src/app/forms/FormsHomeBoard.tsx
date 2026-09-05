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
  isFormNeedsAttention,
  loadFormSeen,
  loadFormSeenLocal,
  type FormSeenMap,
} from "@/lib/formReadStore";

type SearchFilters = {
  formType: "" | FormTypeKey;
  dateFrom: string;
  dateTo: string;
  productCategory: "" | ProductCategory;
  author: string;
  handler: string;
  completion: "" | "done" | "pending";
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
    dateFrom: "",
    dateTo: "",
    productCategory: "",
    author: "",
    handler: "",
    completion: "",
    content: "",
  };
}

function cellText(v: string): string {
  const t = v.trim();
  return t !== "" && t !== "—" ? t : "—";
}

function ClampedCell({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const display = cellText(value);
  return (
    <div
      className={`line-clamp-2 break-words whitespace-pre-wrap ${className}`}
      title={display !== "—" ? display : undefined}
    >
      {display}
    </div>
  );
}

function effectiveDateRange(filters: SearchFilters): {
  from: string;
  to: string;
} {
  return {
    from: filters.dateFrom.trim(),
    to: filters.dateTo.trim(),
  };
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
  seen,
  emptyMessage,
  showActivity,
}: {
  rows: RecentBoardRow[];
  seen: FormSeenMap;
  emptyMessage: string;
  showActivity?: boolean;
}) {
  const cellBorder = "border-b border-zinc-200";
  const colCount = showActivity ? 9 : 8;
  const stickyShadow = "shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)]";
  const stickyThNo = showActivity
    ? `sticky left-[8.5rem] z-30 bg-zinc-100 ${stickyShadow}`
    : `sticky left-0 z-30 bg-zinc-100 ${stickyShadow}`;
  const stickyTdNo = showActivity
    ? `sticky left-[8.5rem] z-20 bg-white group-hover:bg-zinc-50 ${stickyShadow}`
    : `sticky left-0 z-20 bg-white group-hover:bg-zinc-50 ${stickyShadow}`;
  const stickyThActivity = `sticky left-0 z-30 bg-zinc-100 ${stickyShadow}`;
  const stickyTdActivity = `sticky left-0 z-20 bg-white group-hover:bg-zinc-50 ${stickyShadow}`;

  return (
    <div className="relative max-h-[min(70vh,720px)] overflow-auto overscroll-contain">
      <table className="min-w-[980px] w-full border-separate border-spacing-0 text-sm">
        <thead className="sticky top-0 z-40 bg-zinc-100">
          <tr className="bg-zinc-100 text-center text-xs font-medium text-zinc-700">
            {showActivity ? (
              <th
                className={`w-[8.5rem] max-w-[8.5rem] whitespace-nowrap px-2 py-2.5 ${cellBorder} ${stickyThActivity}`}
              >
                변동
              </th>
            ) : null}
            <th
              className={`w-px whitespace-nowrap px-2 py-2.5 ${cellBorder} ${stickyThNo}`}
            >
              NO
            </th>
            <th className={`w-px whitespace-nowrap px-2 py-2.5 ${cellBorder}`}>
              일자
            </th>
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
                colSpan={colCount}
                className="px-4 py-10 text-center text-sm text-zinc-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const needsAttention = isFormNeedsAttention(
                seen,
                row.id,
                row.updatedAtIso
              );
              const rowClass = needsAttention
                ? "font-bold text-zinc-900"
                : "font-normal text-zinc-500";
              const linkClass = needsAttention
                ? "text-zinc-900 hover:text-sky-800"
                : "text-zinc-500 hover:text-zinc-700";

              return (
                <tr key={row.id} className="group hover:bg-zinc-50/80">
                  {showActivity ? (
                    <td
                      className={`w-[8.5rem] max-w-[8.5rem] px-2 py-2.5 align-top ${cellBorder} ${stickyTdActivity}`}
                    >
                      <div
                        className="space-y-0.5 text-left text-xs leading-snug"
                        title={row.activityLabel}
                      >
                        <div className="whitespace-nowrap font-medium text-zinc-700">
                          {row.activityDateLabel}
                        </div>
                        <div
                          className={`truncate ${
                            row.activityKind === "update"
                              ? "font-semibold text-sky-700"
                              : "font-semibold text-emerald-700"
                          }`}
                        >
                          {row.activityDetail}
                        </div>
                      </div>
                    </td>
                  ) : null}
                  <td
                    className={`w-px whitespace-nowrap px-2 py-2.5 text-center align-top ${cellBorder} ${rowClass} ${stickyTdNo}`}
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
                    className={`w-px whitespace-nowrap px-2 py-2.5 text-center align-top ${cellBorder} ${rowClass}`}
                  >
                    {cellText(row.docDate)}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}
                  >
                    {row.formTypeLabel}
                  </td>
                  <td
                    className={`whitespace-nowrap px-3 py-2.5 text-center align-top ${cellBorder} ${rowClass}`}
                  >
                    {cellText(row.productCategory)}
                  </td>
                  <td className={`px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}>
                    <ClampedCell value={row.productName} />
                  </td>
                  <td className={`px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}>
                    <ClampedCell value={row.content} />
                  </td>
                  <td className={`px-3 py-2.5 align-top ${cellBorder} ${rowClass}`}>
                    <ClampedCell value={row.handlingContent} />
                  </td>
                  <td
                    className={`px-3 py-2.5 text-center align-top ${cellBorder} ${rowClass}`}
                  >
                    <ClampedCell value={row.causeAnalysis} />
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
  mode = "all",
}: {
  rows: RecentBoardRow[];
  userId: string;
  mode?: "all" | "recent";
}) {
  const [filters, setFilters] = useState<SearchFilters>(createDefaultFilters);
  const [hideSearchResults, setHideSearchResults] = useState(false);
  const [seen, setSeen] = useState<FormSeenMap>(() =>
    loadFormSeenLocal(userId)
  );
  const pathname = usePathname();

  const refreshSeen = useCallback(() => {
    void loadFormSeen(userId).then(setSeen);
  }, [userId]);

  useEffect(() => {
    refreshSeen();

    const onReadChanged = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string }>).detail;
      if (detail?.userId !== userId) return;
      setSeen(loadFormSeenLocal(userId));
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refreshSeen();
    };

    window.addEventListener(FORM_READ_CHANGED_EVENT, onReadChanged);
    window.addEventListener("focus", refreshSeen);
    window.addEventListener("pageshow", refreshSeen);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      window.removeEventListener(FORM_READ_CHANGED_EVENT, onReadChanged);
      window.removeEventListener("focus", refreshSeen);
      window.removeEventListener("pageshow", refreshSeen);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId, refreshSeen]);

  useEffect(() => {
    if (pathname === "/forms") refreshSeen();
  }, [pathname, refreshSeen]);

  const searchFiltered = useMemo(() => {
    const typeQ = filters.formType;
    const { from, to } = effectiveDateRange(filters);
    const categoryQ = filters.productCategory;
    const authorQ = filters.author.trim().toLowerCase();
    const handlerQ = filters.handler.trim().toLowerCase();
    const completionQ = filters.completion;
    const contentQ = filters.content.trim().toLowerCase();

    return rows.filter((row) => {
      if (typeQ && row.formType !== typeQ) return false;
      if (!matchesDateRange(row.docDateRaw, from, to)) return false;
      if (categoryQ && row.productCategory !== categoryQ) return false;
      if (authorQ && !row.author.toLowerCase().includes(authorQ)) return false;
      if (handlerQ && !row.handler.toLowerCase().includes(handlerQ))
        return false;
      if (completionQ === "done" && !row.completed) return false;
      if (completionQ === "pending" && row.completed) return false;
      if (contentQ) {
        const hay = `${row.content}\n${row.productName}\n${row.handlingContent}\n${row.causeAnalysis}`.toLowerCase();
        if (!hay.includes(contentQ)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const recentUnreadRows = useMemo(() => {
    const { dateFrom, dateTo } = defaultDateRange();
    return rows
      .filter((row) => {
        if (!isFormNeedsAttention(seen, row.id, row.updatedAtIso)) return false;
        return matchesDateRange(row.activityDateRaw, dateFrom, dateTo);
      })
      .sort((a, b) => b.updatedAtIso.localeCompare(a.updatedAtIso));
  }, [rows, seen]);

  const resetSearch = () => setFilters(createDefaultFilters());

  const downloadSearchExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const headers = [
      "NO",
      "일자",
      "서류종류",
      "제품구분",
      "제품명",
      "내용",
      "조치내용",
      "원인분석 및 처리",
      "발행자",
      "처리자",
      "완료",
    ] as const;

    const data = searchFiltered.map((row) => ({
      NO: cellText(row.no),
      일자: cellText(row.docDate),
      서류종류: row.formTypeLabel,
      제품구분: cellText(row.productCategory),
      제품명: cellText(row.productName),
      내용: cellText(row.content),
      조치내용: cellText(row.handlingContent),
      "원인분석 및 처리": cellText(row.causeAnalysis),
      발행자: cellText(row.author),
      처리자: cellText(row.handler),
      완료: row.completed ? "완료" : "미완료",
    }));

    const ws = XLSX.utils.json_to_sheet(data, {
      header: [...headers],
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "검색결과");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    const blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    a.download = `qadm-전체검색-${y}${m}${d}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [searchFiltered]);

  const searchEmptyMessage =
    rows.length === 0
      ? "아직 서식이 없어요. 우측 상단에서 서류작성을 눌러 보세요."
      : "검색 조건에 맞는 서식이 없습니다.";

  return (
    <div className="space-y-4">
      {mode === "all" ? (
        <>
      <section className="rounded-xl border border-black bg-white px-3 py-2">
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
              className="w-[5.25rem] rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-zinc-400"
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
              className="w-[4.5rem] rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-zinc-400"
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
              className="w-20 rounded-lg border border-zinc-200 px-1.5 py-1 text-xs outline-none focus:border-zinc-400"
            />
          </label>
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-medium text-zinc-600">처리자</span>
            <input
              type="search"
              value={filters.handler}
              onChange={(e) =>
                setFilters((f) => ({ ...f, handler: e.target.value }))
              }
              placeholder="부서·담당"
              className="w-20 rounded-lg border border-zinc-200 px-1.5 py-1 text-xs outline-none focus:border-zinc-400"
            />
          </label>
          <label className="inline-flex min-w-0 items-center gap-1.5">
            <span className="shrink-0 font-medium text-zinc-600">완료</span>
            <select
              value={filters.completion}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  completion: e.target.value as SearchFilters["completion"],
                }))
              }
              className="w-[4.75rem] rounded-lg border border-zinc-200 bg-white px-1.5 py-1 text-xs outline-none focus:border-zinc-400"
            >
              <option value="">전체</option>
              <option value="done">완료</option>
              <option value="pending">미완료</option>
            </select>
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
        <div className="flex items-center gap-3 border-b border-zinc-200 bg-zinc-900 px-4 py-2 text-left sm:px-5">
          <h2 className="pl-[2ch] text-sm font-semibold text-white">검색 결과</h2>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-white/30 bg-white/10 px-2 py-0.5 text-xs text-white hover:bg-white/15">
            <input
              type="checkbox"
              checked={hideSearchResults}
              onChange={(e) => setHideSearchResults(e.target.checked)}
              className="size-3.5 accent-white"
            />
            전체 숨기기
          </label>
          {hideSearchResults ? (
            <span className="text-xs text-zinc-300">
              {searchFiltered.length}건 숨김
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void downloadSearchExcel()}
            disabled={searchFiltered.length === 0}
            className="ml-auto shrink-0 rounded-lg border border-white/30 bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            title="현재 검색결과 기준으로 다운로드"
          >
            엑셀 다운로드
          </button>
        </div>
        {hideSearchResults ? null : (
          <FormsBoardTable
            rows={searchFiltered}
            seen={seen}
            emptyMessage={searchEmptyMessage}
          />
        )}
      </section>
        </>
      ) : null}

      {mode === "recent" ? (
      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 bg-zinc-900 px-4 py-2 text-left sm:px-5">
          <h2 className="pl-[2ch] text-sm font-semibold text-white">최근게시글</h2>
        </div>
        <FormsBoardTable
          rows={recentUnreadRows}
          seen={seen}
          showActivity
          emptyMessage={
            rows.length === 0
              ? "아직 서식이 없어요. 우측 상단에서 서류작성을 눌러 보세요."
              : "확인할 신규·수정 서류가 없습니다."
          }
        />
      </section>
      ) : null}
    </div>
  );
}
