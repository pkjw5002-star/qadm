"use client";

import { useMemo, useState } from "react";
import FormListTable from "@/app/forms/FormListTable";
import type { FormListRow } from "@/app/forms/formListTableTypes";
import {
  COMPLAINT_FORM_LIST_COLUMNS,
  COMPLAINT_FORM_LIST_STORAGE_KEY,
} from "@/app/forms/formListTablePresets";
import { useFormListDateRange } from "@/app/forms/useFormListDateRange";

export default function ComplaintFormsTable({
  rows,
}: {
  rows: FormListRow[];
}) {
  const [onlyNotRecovered, setOnlyNotRecovered] = useState(false);
  const [onlyRecoveredIncomplete, setOnlyRecoveredIncomplete] =
    useState(false);
  const {
    withDateColumnFilter,
    externalColumnFilters,
    onExternalColumnFilterChange,
    filterRowsByDate,
    dateRangeToolbar,
  } = useFormListDateRange("receiptDate", "접수일");

  const columns = useMemo(
    () => withDateColumnFilter(COMPLAINT_FORM_LIST_COLUMNS),
    [withDateColumnFilter]
  );

  const listRows = useMemo(() => {
    let next = filterRowsByDate(rows);
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
    filterRowsByDate,
    onlyNotRecovered,
    onlyRecoveredIncomplete,
  ]);

  const leadingToolbar = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-800">
      {dateRangeToolbar}
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
