import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import type { FormTypeKey } from "@/lib/formTypes";
import ComplaintFormsTable from "@/app/forms/ComplaintFormsTable";
import ReviewProcessFilterFormsTable from "@/app/forms/ReviewProcessFilterFormsTable";
import FormsHomeBoard from "@/app/forms/FormsHomeBoard";
import { buildRecentBoardRow } from "@/lib/formRecentBoard";
import {
  QUALITY_IMPROVEMENT_LIST_COLUMNS,
  QUALITY_IMPROVEMENT_LIST_STORAGE_KEY,
  ABNORMAL_REPORT_LIST_COLUMNS,
  ABNORMAL_REPORT_LIST_STORAGE_KEY,
  WORK_COOP_LIST_COLUMNS,
  WORK_COOP_LIST_STORAGE_KEY,
  SUGGESTION_LIST_COLUMNS,
  SUGGESTION_LIST_STORAGE_KEY,
} from "@/app/forms/formListTablePresets";
import type { FormListRow } from "@/app/forms/formListTableTypes";
import { getCommentPreview } from "@/lib/formListComment";
import {
  complaintRowFromSnapshot,
  isStoredListSnapshotValid,
  resolveListSnapshot,
  reviewFilterRowFromSnapshot,
} from "@/lib/formListSnapshot";

const formListSelect = {
  id: true,
  type: true,
  title: true,
  createdAt: true,
  commentCount: true,
  createdBy: { select: { name: true } },
  events: {
    where: { action: "COMMENT" },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    select: {
      payload: true,
      createdAt: true,
      actor: { select: { name: true } },
    },
  },
} as const;

export default async function FormsListContent({
  type,
}: {
  type?: FormTypeKey;
}) {
  const user = await requireUser();
  const isComplaintList = type === "COMPLAINT";
  const isQualityImprovementList = type === "QUALITY_IMPROVEMENT";
  const isAbnormalList = type === "ABNORMAL_REPORT";
  const isWorkCoopList = type === "WORK_COOP";
  const isSuggestionList = type === "SUGGESTION";
  const isTypedList =
    isComplaintList ||
    isQualityImprovementList ||
    isAbnormalList ||
    isWorkCoopList ||
    isSuggestionList;

  if (!isTypedList) {
    const forms = await prisma.form.findMany({
      where: undefined,
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        ...formListSelect,
        data: true,
      },
    });

    const homeRows = forms.flatMap((f) => {
      const row = buildRecentBoardRow({
        id: f.id,
        type: f.type,
        title: f.title,
        data: f.data,
        authorName: f.createdBy.name,
        createdAt: f.createdAt,
      });
      return row ? [row] : [];
    });

    return <FormsHomeBoard rows={homeRows} userId={user.id} />;
  }

  const forms = await prisma.form.findMany({
    where: { type },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      ...formListSelect,
      listSnapshot: true,
    },
  });

  const dataByFormId = new Map<string, unknown>();
  if (forms.length > 0) {
    const missingIds = forms
      .filter((f) => !isStoredListSnapshotValid(f.type, f.listSnapshot))
      .map((f) => f.id);
    if (missingIds.length > 0) {
      const fallbackRows = await prisma.form.findMany({
        where: { id: { in: missingIds } },
        select: { id: true, data: true },
      });
      for (const row of fallbackRows) {
        dataByFormId.set(row.id, row.data);
      }
    }
  }

  const complaintRows: FormListRow[] = isComplaintList
    ? forms.flatMap((f) => {
        const snap = resolveListSnapshot({
          type: f.type,
          data: dataByFormId.get(f.id),
          title: f.title,
          authorName: f.createdBy.name,
          createdAt: f.createdAt,
          listSnapshot: f.listSnapshot,
        });
        if (!snap || snap.kind !== "COMPLAINT") return [];
        const preview = getCommentPreview(f.events[0], f.commentCount);
        return [
          complaintRowFromSnapshot(f.id, snap, {
            line: preview?.line ?? null,
            tooltip: preview?.tooltip ?? null,
          }),
        ];
      })
    : [];

  const mapReviewRows = () =>
    forms.flatMap((f) => {
      const snap = resolveListSnapshot({
        type: f.type,
        data: dataByFormId.get(f.id),
        title: f.title,
        authorName: f.createdBy.name,
        createdAt: f.createdAt,
        listSnapshot: f.listSnapshot,
      });
      if (!snap || snap.kind !== "REVIEW_FILTER") return [];
      const preview = getCommentPreview(f.events[0], f.commentCount);
      return [
        reviewFilterRowFromSnapshot(f.id, snap, {
          line: preview?.line ?? null,
          tooltip: preview?.tooltip ?? null,
        }),
      ];
    });

  const qualityRows = isQualityImprovementList ? mapReviewRows() : [];
  const abnormalRows = isAbnormalList ? mapReviewRows() : [];
  const workCoopRows = isWorkCoopList ? mapReviewRows() : [];
  const suggestionRows = isSuggestionList ? mapReviewRows() : [];

  const isEmpty = isComplaintList
    ? complaintRows.length === 0
    : isQualityImprovementList
      ? qualityRows.length === 0
      : isAbnormalList
        ? abnormalRows.length === 0
        : isWorkCoopList
          ? workCoopRows.length === 0
          : suggestionRows.length === 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      {isEmpty ? (
        <div className="px-4 py-10 text-center text-sm text-zinc-600">
          {forms.length > 0
            ? "목록 데이터를 불러올 수 없습니다. 잠시 후 다시 시도해 주세요."
            : "아직 서식이 없어요. 우측 상단에서 서류작성을 눌러 보세요."}
        </div>
      ) : isComplaintList ? (
        <ComplaintFormsTable rows={complaintRows} />
      ) : isQualityImprovementList ? (
        <ReviewProcessFilterFormsTable
          storageKey={QUALITY_IMPROVEMENT_LIST_STORAGE_KEY}
          columns={QUALITY_IMPROVEMENT_LIST_COLUMNS}
          rows={qualityRows}
          filterTitle="미검토"
          filterHint="(검토일자 없음)"
        />
      ) : isAbnormalList ? (
        <ReviewProcessFilterFormsTable
          storageKey={ABNORMAL_REPORT_LIST_STORAGE_KEY}
          columns={ABNORMAL_REPORT_LIST_COLUMNS}
          rows={abnormalRows}
          filterTitle="미처리"
          filterHint="(처리일자 없음)"
        />
      ) : isWorkCoopList ? (
        <ReviewProcessFilterFormsTable
          storageKey={WORK_COOP_LIST_STORAGE_KEY}
          columns={WORK_COOP_LIST_COLUMNS}
          rows={workCoopRows}
          filterTitle="미처리"
          filterHint="(처리일자 또는 처리예정일자·사유 없음)"
        />
      ) : (
        <ReviewProcessFilterFormsTable
          storageKey={SUGGESTION_LIST_STORAGE_KEY}
          columns={SUGGESTION_LIST_COLUMNS}
          rows={suggestionRows}
          filterTitle="미처리"
          filterHint="(처리(예정)일자 없음)"
        />
      )}
    </div>
  );
}
