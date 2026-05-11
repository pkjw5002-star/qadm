"use client";

import { useMemo, useState } from "react";
import FormListTable from "@/app/forms/FormListTable";
import type { FormListRow } from "@/app/forms/formListTableTypes";
import {
  COMPLAINT_FORM_LIST_COLUMNS,
  COMPLAINT_FORM_LIST_STORAGE_KEY,
} from "@/app/forms/formListTablePresets";

export type ComplaintListRowVm = {
  id: string;
  no: string;
  receiptDate: string;
  customerInfo: string;
  productName: string;
  departmentAndOwner: string;
  content: string;
  actionContent: string;
  outsideAsDateAndExecutor: string;
  outsideAsContent: string;
  outsideAsTime: string;
  recoveryDate: string;
  causeAnalysisDate: string;
  /** 회수일자 없음 → 미회수 */
  missingRecoveryDate: boolean;
  /** 회수일 있음·원인분석일자 공란 → 회수 후 미완료 */
  recoveredWithoutCauseAnalysisDate: boolean;
  defectPhenomenon: string;
  defectCauseAnalysis: string;
  recurrencePrevention: string;
  recoveryHandlingContent: string;
  commentLine: string | null;
  commentTooltip: string | null;
};

function toFormListRow(row: ComplaintListRowVm): FormListRow {
  const editProdDefectHref = `/forms/${row.id}/edit#complaint-prod-defect`;
  const editProdCauseHref = `/forms/${row.id}/edit#complaint-prod-cause`;
  return {
    id: row.id,
    cells: {
      no: row.no.trim() !== "" ? row.no : "—",
      receiptDate: row.receiptDate,
      customerInfo: row.customerInfo,
      productName:
        row.productName.trim() !== "" ? row.productName : "—",
      departmentOwner:
        row.departmentAndOwner.trim() !== ""
          ? row.departmentAndOwner
          : "—",
      content: row.content,
      actionContent: row.actionContent,
      outsideAsMeta: row.outsideAsDateAndExecutor,
      outsideAsContent: row.outsideAsContent,
      outsideAsTime: row.outsideAsTime,
      recoveryDate: row.recoveryDate,
      causeAnalysisDate: row.causeAnalysisDate,
      defectPhenomenon: row.defectPhenomenon,
      defectCauseAnalysis: row.defectCauseAnalysis,
      recurrencePrevention: row.recurrencePrevention,
      recoveryHandling: row.recoveryHandlingContent,
    },
    cellHref: {
      defectPhenomenon: editProdDefectHref,
      defectCauseAnalysis: editProdCauseHref,
    },
    commentLine: row.commentLine,
    commentTooltip: row.commentTooltip,
  };
}

export default function ComplaintFormsTable({
  rows,
}: {
  rows: ComplaintListRowVm[];
}) {
  const [onlyNotRecovered, setOnlyNotRecovered] = useState(false);
  const [onlyRecoveredIncomplete, setOnlyRecoveredIncomplete] =
    useState(false);

  const filteredVm = useMemo(() => {
    if (!onlyNotRecovered && !onlyRecoveredIncomplete) return rows;
    if (onlyNotRecovered && onlyRecoveredIncomplete) {
      return rows.filter(
        (r) => r.missingRecoveryDate || r.recoveredWithoutCauseAnalysisDate
      );
    }
    if (onlyNotRecovered) {
      return rows.filter((r) => r.missingRecoveryDate);
    }
    return rows.filter((r) => r.recoveredWithoutCauseAnalysisDate);
  }, [rows, onlyNotRecovered, onlyRecoveredIncomplete]);

  const listRows = useMemo(
    () => filteredVm.map(toFormListRow),
    [filteredVm]
  );

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
