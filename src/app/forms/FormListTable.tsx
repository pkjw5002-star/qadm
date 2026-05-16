"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { FormListColumn, FormListRow } from "./formListTableTypes";

export type { FormListColumn, FormListRow } from "./formListTableTypes";

type Persisted = {
  widths?: Record<string, number>;
  hidden?: Record<string, boolean>;
};

function cellTitle(explicit: string | undefined, value: string): string | undefined {
  if (explicit != null && String(explicit).trim() !== "") return explicit;
  const t = value.trim();
  if (t === "" || t === "—") return undefined;
  return value;
}

function loadPersisted(key: string): Persisted {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw) as Persisted;
  } catch {
    return {};
  }
}

function buildDefaults(columns: readonly FormListColumn[]) {
  const widths: Record<string, number> = {};
  const minWidths: Record<string, number> = {};
  const hidden: Record<string, boolean> = {};
  for (const c of columns) {
    widths[c.id] = c.defaultWidth;
    minWidths[c.id] = c.minWidth;
    hidden[c.id] = false;
  }
  return { widths, minWidths, hidden };
}

const NON_HIDE = new Set(["no"]);

type LayoutState = {
  widths: Record<string, number>;
  hidden: Record<string, boolean>;
};

/** 열에 표시·검색에 쓰는 전체 문자열 */
function searchHaystack(
  row: FormListRow,
  col: FormListColumn
): string {
  if (col.variant === "comment") {
    const a = row.commentLine != null ? String(row.commentLine) : "";
    const b = row.commentTooltip != null ? String(row.commentTooltip) : "";
    return `${a}\n${b}`;
  }
  return row.cells[col.id] != null ? String(row.cells[col.id]) : "";
}

function rowMatchesColumnFilters(
  row: FormListRow,
  columns: readonly FormListColumn[],
  filters: Record<string, string>
): boolean {
  for (const c of columns) {
    const raw = filters[c.id];
    if (raw === undefined || raw.trim() === "") continue;
    const q = raw.trim().toLowerCase();
    const hay = searchHaystack(row, c).toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export default function FormListTable({
  storageKey,
  columns,
  rows,
  leadingToolbar,
}: {
  storageKey: string;
  columns: readonly FormListColumn[];
  rows: FormListRow[];
  /** 표 도구줄 왼쪽(예: 불만 전용 필터) */
  leadingToolbar?: ReactNode;
}) {
  const colIds = useMemo(() => columns.map((c) => c.id), [columns]);
  const colById = useMemo(() => {
    const m = new Map<string, FormListColumn>();
    for (const c of columns) m.set(c.id, c);
    return m;
  }, [columns]);

  const defaults = useMemo(() => buildDefaults(columns), [columns]);

  const [layout, setLayout] = useState<LayoutState>(() => ({
    widths: { ...defaults.widths },
    hidden: { ...defaults.hidden },
  }));

  const layoutRef = useRef(layout);
  useEffect(() => {
    layoutRef.current = layout;
  }, [layout]);

  const dragRef = useRef<{
    colId: string;
    startX: number;
    startW: number;
  } | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  /** 열 헤더(제목) 클릭 시 해당 열 검색 입력 표시 */
  const [searchOpenColId, setSearchOpenColId] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>(
    {}
  );

  const filteredRows = useMemo(
    () => rows.filter((r) => rowMatchesColumnFilters(r, columns, columnFilters)),
    [rows, columns, columnFilters]
  );

  const hasActiveSearch = useMemo(
    () => Object.values(columnFilters).some((v) => v.trim() !== ""),
    [columnFilters]
  );

  const searchPanelRef = useRef<HTMLTableHeaderCellElement | null>(null);
  useEffect(() => {
    if (searchOpenColId == null) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = searchPanelRef.current;
      if (el && !el.contains(e.target as Node)) {
        setSearchOpenColId(null);
      }
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [searchOpenColId]);

  useEffect(() => {
    const p = loadPersisted(storageKey);
    const widths = { ...defaults.widths };
    const hidden = { ...defaults.hidden };
    if (p.widths) {
      for (const id of colIds) {
        const w = p.widths[id];
        if (typeof w === "number" && Number.isFinite(w)) {
          widths[id] = Math.max(defaults.minWidths[id] ?? 40, w);
        }
      }
    }
    if (p.hidden) {
      for (const id of colIds) {
        if (NON_HIDE.has(id)) continue;
        if (p.hidden[id] === true) hidden[id] = true;
      }
    }
    requestAnimationFrame(() => setLayout({ widths, hidden }));
  }, [storageKey, colIds, defaults]);

  const persist = useCallback(
    (w: Record<string, number>, h: Record<string, boolean>) => {
      if (typeof window === "undefined") return;
      const payload: Persisted = { widths: {}, hidden: {} };
      for (const id of colIds) {
        if (w[id] !== defaults.widths[id]) {
          payload.widths ??= {};
          payload.widths[id] = w[id];
        }
        if (h[id]) {
          payload.hidden ??= {};
          payload.hidden[id] = true;
        }
      }
      try {
        const wKeys = payload.widths ? Object.keys(payload.widths).length : 0;
        const hKeys = payload.hidden ? Object.keys(payload.hidden).length : 0;
        if (wKeys === 0 && hKeys === 0) {
          localStorage.removeItem(storageKey);
        } else {
          localStorage.setItem(storageKey, JSON.stringify(payload));
        }
      } catch {
        /* ignore */
      }
    },
    [storageKey, colIds, defaults.widths]
  );

  const { widths, hidden } = layout;

  const visibleCols = useMemo(
    () => colIds.filter((id) => !hidden[id]),
    [colIds, hidden]
  );

  const totalWidth = useMemo(
    () => visibleCols.reduce((s, id) => s + (widths[id] ?? 80), 0),
    [visibleCols, widths]
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const minW = defaults.minWidths[d.colId] ?? 40;
      const nw = Math.max(minW, d.startW + e.clientX - d.startX);
      setLayout((prev) => ({
        ...prev,
        widths: { ...prev.widths, [d.colId]: nw },
      }));
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      const { widths: w, hidden: h } = layoutRef.current;
      persist(w, h);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [persist, defaults.minWidths]);

  const startResize = (colId: string, clientX: number) => {
    dragRef.current = {
      colId,
      startX: clientX,
      startW: layoutRef.current.widths[colId] ?? 80,
    };
    // eslint-disable-next-line react-hooks/immutability
    document.body.style.cursor = "col-resize";
    // eslint-disable-next-line react-hooks/immutability
    document.body.style.userSelect = "none";
  };

  const toggleHidden = (id: string, showColumn: boolean) => {
    if (NON_HIDE.has(id)) return;
    setLayout((prev) => {
      const next = {
        ...prev,
        hidden: { ...prev.hidden, [id]: !showColumn },
      };
      persist(next.widths, next.hidden);
      return next;
    });
  };

  const resetLayout = () => {
    const next = {
      widths: { ...defaults.widths },
      hidden: { ...defaults.hidden },
    };
    setLayout(next);
    persist(next.widths, next.hidden);
  };

  const clearSearch = () => {
    setColumnFilters({});
    setSearchOpenColId(null);
  };

  const labelFor = useCallback(
    (id: string) => colById.get(id)?.label ?? id,
    [colById]
  );

  const downloadExcel = useCallback(async () => {
    const XLSX = await import("xlsx");
    const cols = visibleCols.map((id) => ({
      id,
      label: labelFor(id),
    }));

    const data = filteredRows.map((row) => {
      const out: Record<string, string> = {};
      for (const c of cols) {
        const col = colById.get(c.id);
        if (col?.variant === "comment") {
          const a = row.commentLine != null ? String(row.commentLine) : "";
          const b = row.commentTooltip != null ? String(row.commentTooltip) : "";
          const merged = [a, b].filter((x) => x.trim() !== "").join("\n");
          out[c.label] = merged || "—";
        } else {
          out[c.label] = row.cells[c.id] ?? "—";
        }
      }
      return out;
    });

    const ws = XLSX.utils.json_to_sheet(data, {
      header: cols.map((c) => c.label),
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "목록");
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
    a.download = `qadm-${storageKey}-${y}${m}${d}.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [colById, filteredRows, labelFor, storageKey, visibleCols]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-2">
          {leadingToolbar}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          onClick={downloadExcel}
          title="현재 표시된 열·검색 결과 기준으로 다운로드"
        >
          엑셀 다운로드
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          onClick={() => setPanelOpen((o) => !o)}
        >
          {panelOpen ? "열 설정 닫기" : "열 표시 / 숨기기"}
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          onClick={resetLayout}
          title="너비·숨김을 초기값으로 되돌립니다"
        >
          표 레이아웃 초기화
        </button>
        <button
          type="button"
          className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!hasActiveSearch}
          onClick={clearSearch}
          title="모든 열 검색어를 지웁니다"
        >
          검색 초기화
        </button>
        </div>
      </div>

      {panelOpen ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-xs text-zinc-800">
          <div className="mb-2 font-medium text-zinc-700">표시할 열</div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {colIds.map((id) => {
              const disabled = NON_HIDE.has(id);
              return (
                <label
                  key={id}
                  className={
                    disabled
                      ? "inline-flex cursor-not-allowed items-center gap-1.5 text-zinc-400"
                      : "inline-flex cursor-pointer items-center gap-1.5"
                  }
                >
                  <input
                    type="checkbox"
                    checked={!hidden[id]}
                    disabled={disabled}
                    title={disabled ? "NO 열은 항상 표시됩니다" : undefined}
                    onChange={(e) => toggleHidden(id, e.target.checked)}
                  />
                  {labelFor(id)}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}

      {hasActiveSearch ? (
        <p className="px-1 text-xs text-zinc-600">
          검색 결과{" "}
          <span className="font-medium text-zinc-900">{filteredRows.length}</span>
          건 (전체 {rows.length}건). 여러 열에 검색어가 있으면 모두 포함된 행만
          표시합니다.
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <table
          className="border-collapse text-sm"
          style={{
            tableLayout: "fixed",
            width: Math.max(totalWidth, 400),
            minWidth: Math.max(totalWidth, 400),
          }}
        >
          <colgroup>
            {visibleCols.map((id) => (
              <col key={id} style={{ width: widths[id] ?? 80 }} />
            ))}
          </colgroup>
          <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-xs font-medium text-zinc-600">
            <tr>
              {visibleCols.map((id) => (
                <th
                  key={id}
                  ref={searchOpenColId === id ? searchPanelRef : undefined}
                  className="relative px-2 py-2 align-top font-medium"
                >
                  <div className="min-w-0 pr-4">
                    <button
                      type="button"
                      className={`w-full rounded-md px-1 py-0.5 text-left hover:bg-zinc-200/80 ${
                        columnFilters[id]?.trim()
                          ? "text-sky-800"
                          : "text-zinc-700"
                      }`}
                      title="클릭하여 이 열에서 검색 (부분 일치)"
                      onClick={() =>
                        setSearchOpenColId((cur) => (cur === id ? null : id))
                      }
                    >
                      <span className="inline-flex max-w-full items-baseline gap-1">
                        <span className="min-w-0 break-words">{labelFor(id)}</span>
                        {columnFilters[id]?.trim() ? (
                          <span
                            className="shrink-0 text-[10px] font-normal text-sky-600"
                            aria-hidden
                          >
                            ●
                          </span>
                        ) : null}
                      </span>
                    </button>
                    {searchOpenColId === id ? (
                      <input
                        type="search"
                        value={columnFilters[id] ?? ""}
                        onChange={(e) =>
                          setColumnFilters((prev) => ({
                            ...prev,
                            [id]: e.target.value,
                          }))
                        }
                        placeholder={`${labelFor(id)} 검색`}
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs font-normal text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-sky-400"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setSearchOpenColId(null);
                        }}
                      />
                    ) : null}
                  </div>
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    className="absolute right-0 top-0 z-10 h-full w-1.5 cursor-col-resize select-none hover:bg-sky-200/80"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      startResize(id, e.clientX);
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(visibleCols.length, 1)}
                  className="border-b border-zinc-100 px-4 py-10 text-center text-sm text-zinc-500"
                >
                  검색 조건에 맞는 행이 없습니다.
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => {
              const hp = row.highlightPending === true;
              const bodyClass = hp ? "text-blue-600" : "text-zinc-800";
              const mutedClass = hp ? "text-blue-500" : "text-zinc-500";
              const strongClass = hp ? "text-blue-700" : "text-zinc-900";
              const hrefBodyClass = hp
                ? "text-blue-700 hover:underline"
                : "text-sky-900 hover:underline";

              return (
              <tr key={row.id} className="hover:bg-zinc-50">
                {visibleCols.map((id) => {
                  const col = colById.get(id);
                  const variant = col?.variant ?? "text";
                  if (variant === "no") {
                    const label =
                      row.cells[id]?.trim() !== ""
                        ? row.cells[id]!
                        : "—";
                    return (
                      <td
                        key={id}
                        className="border-b border-zinc-100 px-1 py-2 align-top"
                      >
                        <Link
                          href={`/forms/${row.id}`}
                          title={label !== "—" ? label : undefined}
                          className={`block truncate whitespace-nowrap font-medium hover:underline ${strongClass}`}
                        >
                          {label}
                        </Link>
                      </td>
                    );
                  }
                  if (variant === "comment") {
                    if (!row.commentLine) {
                      return (
                        <td
                          key={id}
                          className={`border-b border-zinc-100 px-2 py-2 align-top text-xs leading-snug ${mutedClass}`}
                        >
                          —
                        </td>
                      );
                    }
                    return (
                      <td
                        key={id}
                        className={`border-b border-zinc-100 px-2 py-2 align-top text-xs leading-snug ${bodyClass}`}
                      >
                        <div
                          className="line-clamp-2 break-words whitespace-pre-wrap"
                          title={row.commentTooltip ?? undefined}
                        >
                          {row.commentLine}
                        </div>
                      </td>
                    );
                  }
                  const v = row.cells[id] ?? "—";
                  const tip = cellTitle(undefined, v);
                  if (variant === "date") {
                    return (
                      <td
                        key={id}
                        className={`border-b border-zinc-100 px-1.5 py-2 align-top text-xs leading-snug ${bodyClass}`}
                      >
                        <div className="truncate whitespace-nowrap" title={tip}>
                          {v}
                        </div>
                      </td>
                    );
                  }
                  if (variant === "compact") {
                    return (
                      <td
                        key={id}
                        className={`border-b border-zinc-100 px-1.5 py-2 align-top text-xs leading-snug ${bodyClass}`}
                      >
                        <div className="truncate" title={tip}>
                          {v}
                        </div>
                      </td>
                    );
                  }
                  const t = cellTitle(v !== "—" ? v : undefined, v);
                  const href = row.cellHref?.[id];
                  const textBlock = (
                    <div
                      className="line-clamp-3 break-words whitespace-pre-wrap"
                      title={t}
                    >
                      {v}
                    </div>
                  );
                  return (
                    <td
                      key={id}
                      className={`border-b border-zinc-100 px-2 py-2 align-top text-xs leading-snug ${bodyClass}`}
                    >
                      {href ? (
                        <Link
                          href={href}
                          className={`block ${hrefBodyClass}`}
                          title={t}
                        >
                          {textBlock}
                        </Link>
                      ) : (
                        textBlock
                      )}
                    </td>
                  );
                })}
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
