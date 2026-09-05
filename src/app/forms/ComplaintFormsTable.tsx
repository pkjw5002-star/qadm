"use client";

import { useMemo, useState } from "react";
import FormListTable from "@/app/forms/FormListTable";
import type { FormListRow } from "@/app/forms/formListTableTypes";
import {
  COMPLAINT_FORM_LIST_COLUMNS,
  COMPLAINT_FORM_LIST_STORAGE_KEY,
} from "@/app/forms/formListTablePresets";

type DatePreset = "all" | "1m" | "3m" | "6m" | "year" | "custom";

const RECEIPT_DATE_PRESET_OPTIONS = [
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

function parseReceiptDateIso(display: string): string | null {
  const t = display.trim();
  if (!t || t === "—") return null;
  const m = t.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!m) return null;
  return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
}

function matchesReceiptDateRange(
  row: FormListRow,
  from: string,
  to: string
): boolean {
  if (!from && !to) return true;
  const iso = parseReceiptDateIso(row.cells.receiptDate ?? "");
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

export default function ComplaintFormsTable({
  rows,
}: {
  rows: FormListRow[];
}) {
  const [onlyNotRecovered, setOnlyNotRecovered] = useState(false);
  const [onlyRecoveredIncomplete, setOnlyRecoveredIncomplete] =
    useState(false);
  const [dateFilterOn, setDateFilterOn] = useState(false);
  const [datePreset, setDatePreset] = useState<DatePreset>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const applyPreset = (preset: Exclude<DatePreset, "custom">) => {
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
  };

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

  const columns = useMemo(
    () =>
      COMPLAINT_FORM_LIST_COLUMNS.map((col) =>
        col.id === "receiptDate"
          ? {
              ...col,
              hideSearch: false,
              filterOptions: RECEIPT_DATE_PRESET_OPTIONS,
              filterExternal: true,
            }
          : col
      ),
    []
  );

  const externalColumnFilters = useMemo(
    () => ({
      receiptDate:
        datePreset === "custom"
          ? "직접"
          : LABEL_BY_PRESET[datePreset === "all" ? "all" : datePreset],
    }),
    [datePreset]
  );

  const onExternalColumnFilterChange = (columnId: string, value: string) => {
    if (columnId !== "receiptDate") return;
    if (value === "직접") return;
    const preset = PRESET_BY_LABEL[value] ?? "all";
    applyPreset(preset);
  };

  const listRows = useMemo(() => {
    let next = rows;
    if (dateFilterOn) {
      next = next.filter((r) =>
        matchesReceiptDateRange(r, dateFrom.trim(), dateTo.trim())
      );
    }
    if (!onlyNotRecovered && !onlyRecoveredIncomplete) return next;
    if (onlyNotRecovered && onlyRecoveredIncomplete) {
      return next.filter(
        (r) => r.filterNotRecovered || r.filterRecoveredIncomplete
      );
    }
    if (onlyNotRecovered) {
      return next.filter((r) => r.filterNotRecovered);
    }
    return next.filter((r) => r.filterRecoveredIncomplete);
  }, [
    rows,
    dateFilterOn,
    dateFrom,
    dateTo,
    onlyNotRecovered,
    onlyRecoveredIncomplete,
  ]);

  const leadingToolbar = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-800">
      <div className="inline-flex flex-wrap items-center gap-2">
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={dateFilterOn}
            onChange={(e) => onDateFilterToggle(e.target.checked)}
            className="rounded border-zinc-300 text-zinc-900"
          />
          <span>접수일</span>
        </label>
        <div className="flex min-w-0 items-center gap-1.5">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            aria-label="접수일 시작"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-zinc-400"
          />
          <span className="text-zinc-400">~</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            aria-label="접수일 종료"
            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-zinc-400"
          />
        </div>
      </div>
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={onlyNotRecovered}
          onChange={(e) => setOnlyNotRecovered(e.target.checked)}
          className="rounded border-zinc-300 text-zinc-900"
        />
        <span>미회수</span>
        <span className="font-normal text-zinc-500">(회수일 없음)</span>
      </label>
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={onlyRecoveredIncomplete}
          onChange={(e) => setOnlyRecoveredIncomplete(e.target.checked)}
          className="rounded border-zinc-300 text-zinc-900"
        />
        <span>회수 후 미완료</span>
        <span className="font-normal text-zinc-500">
          (회수일 있음·원인분석일 없음)
        </span>
      </label>
    </div>
  );

  return (
    <FormListTable
      storageKey={COMPLAINT_FORM_LIST_STORAGE_KEY}
      columns={columns}
      rows={listRows}
      leadingToolbar={leadingToolbar}
      externalColumnFilters={externalColumnFilters}
      onExternalColumnFilterChange={onExternalColumnFilterChange}
    />
  );
}
