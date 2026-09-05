"use client";

import { useMemo, useState } from "react";
import FormListTable from "@/app/forms/FormListTable";
import type { FormListColumn, FormListRow } from "@/app/forms/formListTableTypes";
import { useFormListDateRange } from "@/app/forms/useFormListDateRange";

export type ReviewProcessFilterRow = {
  listRow: FormListRow;
  /** 체크 시 true인 행만 남김 */
  includeWhenFiltered: boolean;
};

export default function ReviewProcessFilterFormsTable({
  rows,
  storageKey,
  columns,
  filterTitle,
  filterHint,
  dateColumnId,
  dateColumnLabel,
}: {
  rows: ReviewProcessFilterRow[];
  storageKey: string;
  columns: FormListColumn[];
  filterTitle: string;
  filterHint: string;
  dateColumnId: string;
  dateColumnLabel: string;
}) {
  const [onlyFiltered, setOnlyFiltered] = useState(false);
  const {
    withDateColumnFilter,
    externalColumnFilters,
    onExternalColumnFilterChange,
    filterRowsByDate,
    dateRangeToolbar,
  } = useFormListDateRange(dateColumnId, dateColumnLabel);

  const tableColumns = useMemo(
    () => withDateColumnFilter(columns),
    [columns, withDateColumnFilter]
  );

  const filtered = useMemo(() => {
    let next = rows;
    if (onlyFiltered) {
      next = next.filter((r) => r.includeWhenFiltered);
    }
    const listRows = next.map((r) => r.listRow);
    return filterRowsByDate(listRows);
  }, [rows, onlyFiltered, filterRowsByDate]);

  const leadingToolbar = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-800">
      {dateRangeToolbar}
      <label className="inline-flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={onlyFiltered}
          onChange={(e) => setOnlyFiltered(e.target.checked)}
          className="rounded border-zinc-300 text-zinc-900"
        />
        <span>{filterTitle}</span>
        <span className="font-normal text-zinc-500">{filterHint}</span>
      </label>
    </div>
  );

  return (
    <FormListTable
      storageKey={storageKey}
      columns={tableColumns}
      rows={filtered}
      leadingToolbar={leadingToolbar}
      externalColumnFilters={externalColumnFilters}
      onExternalColumnFilterChange={onExternalColumnFilterChange}
    />
  );
}
