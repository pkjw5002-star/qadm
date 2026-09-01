"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FORM_TYPES, type FormTypeKey } from "@/lib/formTypes";
import type { RecentBoardRow } from "@/lib/formRecentBoard";
import { loadFormReadIds } from "@/lib/formReadStore";

type SearchFilters = {
  formType: "" | FormTypeKey;
  date: string;
  author: string;
  content: string;
};

const EMPTY_FILTERS: SearchFilters = {
  formType: "",
  date: "",
  author: "",
  content: "",
};

function cellText(v: string): string {
  const t = v.trim();
  return t !== "" && t !== "—" ? t : "—";
}

export default function FormsHomeBoard({
  rows,
  userId,
}: {
  rows: RecentBoardRow[];
  userId: string;
}) {
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      void loadFormReadIds(userId).then((ids) => {
        if (!cancelled) setReadIds(ids);
      });
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [userId]);

  const filtered = useMemo(() => {
    const typeQ = filters.formType;
    const dateQ = filters.date.trim();
    const authorQ = filters.author.trim().toLowerCase();
    const contentQ = filters.content.trim().toLowerCase();

    return rows.filter((row) => {
      if (typeQ && row.formType !== typeQ) return false;
      if (dateQ && !row.docDateRaw.includes(dateQ) && !row.docDate.includes(dateQ)) {
        return false;
      }
      if (authorQ && !row.author.toLowerCase().includes(authorQ)) return false;
      if (contentQ) {
        const hay = `${row.content}\n${row.productName}\n${row.handlingContent}\n${row.causeAnalysis}`.toLowerCase();
        if (!hay.includes(contentQ)) return false;
      }
      return true;
    });
  }, [rows, filters]);

  const resetSearch = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5">
        <h2 className="text-sm font-semibold text-zinc-900">검색항목</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
          <label className="block min-w-0">
            <span className="text-xs font-medium text-zinc-600">서류종류</span>
            <select
              value={filters.formType}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  formType: e.target.value as SearchFilters["formType"],
                }))
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-400"
            >
              <option value="">전체</option>
              {FORM_TYPES.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
            <span className="text-xs font-medium text-zinc-600">일자</span>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters((f) => ({ ...f, date: e.target.value }))
              }
              className="mt-1 w-full max-w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block min-w-0">
            <span className="text-xs font-medium text-zinc-600">발행자</span>
            <input
              type="search"
              value={filters.author}
              onChange={(e) =>
                setFilters((f) => ({ ...f, author: e.target.value }))
              }
              placeholder="작성자 검색"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block min-w-0">
            <span className="text-xs font-medium text-zinc-600">내용</span>
            <input
              type="search"
              value={filters.content}
              onChange={(e) =>
                setFilters((f) => ({ ...f, content: e.target.value }))
              }
              placeholder="내용·제품명 검색"
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </label>
        </div>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={resetSearch}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            검색 초기화
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
          <h2 className="text-sm font-semibold text-zinc-900">최근게시판</h2>
          <p className="mt-0.5 text-xs text-zinc-500">
            안 읽은 글은 굵은 검정, 읽은 글은 옅은 회색으로 표시됩니다.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-zinc-50 text-left text-xs font-medium text-zinc-600">
                <th className="whitespace-nowrap px-3 py-2.5">NO</th>
                <th className="whitespace-nowrap px-3 py-2.5">일자</th>
                <th className="whitespace-nowrap px-3 py-2.5">서류종류</th>
                <th className="min-w-[120px] px-3 py-2.5">제품명</th>
                <th className="min-w-[180px] px-3 py-2.5">내용</th>
                <th className="min-w-[140px] px-3 py-2.5">원인분석</th>
                <th className="min-w-[140px] px-3 py-2.5">처리내용</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-zinc-500"
                  >
                    {rows.length === 0
                      ? "아직 서식이 없어요. 우측 상단에서 서류작성을 눌러 보세요."
                      : "검색 조건에 맞는 서식이 없습니다."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const read = readIds.has(row.id);
                  const rowClass = read
                    ? "font-normal text-zinc-400"
                    : "font-semibold text-zinc-900";
                  const linkClass = read
                    ? "text-zinc-400 hover:text-zinc-600"
                    : "text-zinc-900 hover:text-sky-800";

                  return (
                    <tr
                      key={row.id}
                      className="border-t border-zinc-100 hover:bg-zinc-50/80"
                    >
                      <td className={`px-3 py-2.5 align-top ${rowClass}`}>
                        <Link
                          href={`/forms/${row.id}`}
                          prefetch
                          className={`hover:underline ${linkClass}`}
                        >
                          {cellText(row.no)}
                        </Link>
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2.5 align-top ${rowClass}`}>
                        {cellText(row.docDate)}
                      </td>
                      <td className={`whitespace-nowrap px-3 py-2.5 align-top ${rowClass}`}>
                        {row.formTypeLabel}
                      </td>
                      <td className={`px-3 py-2.5 align-top ${rowClass}`}>
                        <div className="line-clamp-2 break-words whitespace-pre-wrap">
                          {cellText(row.productName)}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 align-top ${rowClass}`}>
                        <div className="line-clamp-3 break-words whitespace-pre-wrap">
                          {cellText(row.content)}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 align-top ${rowClass}`}>
                        <div className="line-clamp-3 break-words whitespace-pre-wrap">
                          {cellText(row.causeAnalysis)}
                        </div>
                      </td>
                      <td className={`px-3 py-2.5 align-top ${rowClass}`}>
                        <div className="line-clamp-3 break-words whitespace-pre-wrap">
                          {cellText(row.handlingContent)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
