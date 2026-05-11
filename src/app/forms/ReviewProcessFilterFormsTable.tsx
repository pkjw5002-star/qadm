"use client";

import { useMemo, useState } from "react";
import FormListTable from "@/app/forms/FormListTable";
import type { FormListColumn, FormListRow } from "@/app/forms/formListTableTypes";

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
}: {
  rows: ReviewProcessFilterRow[];
  storageKey: string;
  columns: FormListColumn[];
  filterTitle: string;
  filterHint: string;
}) {
  const [onlyFiltered, setOnlyFiltered] = useState(false);

  const filtered = useMemo(() => {
    if (!onlyFiltered) return rows;
    return rows.filter((r) => r.includeWhenFiltered);
  }, [rows, onlyFiltered]);

  const listRows = useMemo(
    () => filtered.map((r) => r.listRow),
    [filtered]
  );

  const leadingToolbar = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-800">
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
      columns={columns}
      rows={listRows}
      leadingToolbar={leadingToolbar}
    />
  );
}
