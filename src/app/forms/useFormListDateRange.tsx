"use client";

import { useCallback, useMemo, useState, type ReactNode } from "react";
import type { FormListColumn, FormListRow } from "@/app/forms/formListTableTypes";

export type DatePreset = "all" | "1m" | "3m" | "6m" | "year" | "custom";

export const DATE_PRESET_OPTIONS = [
  "전체",
  "1개월",
  "3개월",
  "6개월",
  "올해",
] as const;

const PRESET_BY_LABEL: Record<string, Exclude<DatePreset, "custom">> = {
  전체: "all",
  "1개월": "1m",
  "3개월": "3m",
  "6개월": "6m",
  올해: "year",
};

const LABEL_BY_PRESET: Record<Exclude<DatePreset, "custom">, string> = {
  all: "전체",
  "1m": "1개월",
  "3m": "3개월",
  "6m": "6개월",
  year: "올해",
};

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rangeForPreset(
  preset: Exclude<DatePreset, "all" | "custom">
): { from: string; to: string } {
  const today = new Date();
  const to = toDateInputValue(today);
  if (preset === "year") {
    return { from: `${today.getFullYear()}-01-01`, to };
  }
  const from = new Date(today);
  const months = preset === "1m" ? 1 : preset === "3m" ? 3 : 6;
  from.setMonth(from.getMonth() - months);
  return { from: toDateInputValue(from), to };
}

export function parseListDateIso(display: string): string | null {
  const t = display.trim();
  if (!t || t === "—") return null;
  const m = t.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function matchesDateRange(
  display: string,
  from: string,
  to: string
): boolean {
  if (!from && !to) return true;
  const iso = parseListDateIso(display);
  if (!iso) return false;
  if (from && iso < from) return false;
  if (to && iso > to) return false;
  return true;
}

function detectPreset(from: string, to: string): DatePreset {
  if (!from && !to) return "all";
  for (const id of ["1m", "3m", "6m", "year"] as const) {
    const range = rangeForPreset(id);
    if (range.from === from && range.to === to) return id;
  }
  return "custom";
}

export function useFormListDateRange(dateColumnId: string, dateLabel: string) {
  const [dateFilterOn, setDateFilterOn] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const applyPreset = useCallback(
    (preset: Exclude<DatePreset, "custom">) => {
      setDatePreset(preset);
      if (preset === "all") {
        setDateFrom("");
        setDateTo("");
        setDateFilterOn(false);
        return;
      }
      const range = rangeForPreset(preset);
      setDateFrom(range.from);
      setDateTo(range.to);
      setDateFilterOn(true);
    },
    []
  );

  const onDateFromChange = (value: string) => {
    setDateFrom(value);
    setDateFilterOn(true);
    setDatePreset(detectPreset(value, dateTo));
  };

  const onDateToChange = (value: string) => {
    setDateTo(value);
    setDateFilterOn(true);
    setDatePreset(detectPreset(dateFrom, value));
  };

  const onDateFilterToggle = (checked: boolean) => {
    setDateFilterOn(checked);
    if (!checked) {
      setDateFrom("");
      setDateTo("");
      setDatePreset("all");
    }
  };

  const withDateColumnFilter = useCallback(
    (columns: readonly FormListColumn[]): FormListColumn[] =>
      columns.map((col) =>
        col.id === dateColumnId
          ? {
              ...col,
              hideSearch: false,
              filterOptions: DATE_PRESET_OPTIONS,
              filterExternal: true,
            }
          : col
      ),
    [dateColumnId]
  );

  const externalColumnFilters = useMemo(
    () => ({
      [dateColumnId]:
        datePreset === "custom"
          ? "직접"
          : LABEL_BY_PRESET[datePreset === "all" ? "all" : datePreset],
    }),
    [dateColumnId, datePreset]
  );

  const onExternalColumnFilterChange = useCallback(
    (columnId: string, value: string) => {
      if (columnId !== dateColumnId) return;
      if (value === "직접") return;
      const preset = PRESET_BY_LABEL[value] ?? "all";
      applyPreset(preset);
    },
    [applyPreset, dateColumnId]
  );

  const filterRowsByDate = useCallback(
    (rows: FormListRow[]) => {
      if (!dateFilterOn) return rows;
      const from = dateFrom.trim();
      const to = dateTo.trim();
      return rows.filter((r) =>
        matchesDateRange(r.cells[dateColumnId] ?? "", from, to)
      );
    },
    [dateColumnId, dateFilterOn, dateFrom, dateTo]
  );

  const dateRangeToolbar: ReactNode = (
    <div className="inline-flex flex-wrap items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={dateFilterOn}
          onChange={(e) => onDateFilterToggle(e.target.checked)}
          className="rounded border-zinc-300 text-zinc-900"
        />
        <span>{dateLabel}</span>
      </label>
      <div className="flex min-w-0 items-center gap-1.5">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onDateFromChange(e.target.value)}
          aria-label={`${dateLabel} 시작`}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-400"
        />
        <span className="text-zinc-400">~</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onDateToChange(e.target.value)}
          aria-label={`${dateLabel} 종료`}
          className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs outline-none focus:border-zinc-400"
        />
      </div>
    </div>
  );

  return {
    withDateColumnFilter,
    externalColumnFilters,
    onExternalColumnFilterChange,
    filterRowsByDate,
    dateRangeToolbar,
  };
}
