"use client";

import { useMemo, useState } from "react";
import FormListTable from "@/app/forms/FormListTable";
import type { FormListRow } from "@/app/forms/formListTableTypes";
import {
  COMPLAINT_FORM_LIST_COLUMNS,
  COMPLAINT_FORM_LIST_STORAGE_KEY,
} from "@/app/forms/formListTablePresets";

export default function ComplaintFormsTable({
  rows,
}: {
  rows: FormListRow[];
}) {
  const [onlyNotRecovered, setOnlyNotRecovered] = useState(false);
  const [onlyRecoveredIncomplete, setOnlyRecoveredIncomplete] =
    useState(false);

  const listRows = useMemo(() => {
    if (!onlyNotRecovered && !onlyRecoveredIncomplete) return rows;
    if (onlyNotRecovered && onlyRecoveredIncomplete) {
      return rows.filter(
        (r) => r.filterNotRecovered || r.filterRecoveredIncomplete
      );
    }
    if (onlyNotRecovered) {
      return rows.filter((r) => r.filterNotRecovered);
    }
    return rows.filter((r) => r.filterRecoveredIncomplete);
  }, [rows, onlyNotRecovered, onlyRecoveredIncomplete]);

  const leadingToolbar = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-zinc-800">
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
      columns={COMPLAINT_FORM_LIST_COLUMNS}
      rows={listRows}
      leadingToolbar={leadingToolbar}
    />
  );
}
