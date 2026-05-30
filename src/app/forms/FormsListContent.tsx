import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { FormTypeKey } from "@/lib/formTypes";
import { FORM_TYPE_LABEL, isFormTypeKey } from "@/lib/formTypes";
import ComplaintFormsTable from "@/app/forms/ComplaintFormsTable";
import ReviewProcessFilterFormsTable from "@/app/forms/ReviewProcessFilterFormsTable";
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

const statusLabel: Record<string, string> = {
  DRAFT: "작성중",
  SUBMITTED: "제출",
  IN_REVIEW: "검토중",
  APPROVED: "승인",
  REJECTED: "반려",
  CLOSED: "종료",
};

export default async function FormsListContent({
  type,
}: {
  type?: FormTypeKey;
}) {
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

  const forms = await prisma.form.findMany({
    where: type ? { type } : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      status: true,
      title: true,
      createdAt: true,
      commentCount: true,
      createdBy: { select: { name: true } },
      ...(isTypedList ? { listSnapshot: true } : {}),
      events: {
        where: { action: "COMMENT" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          payload: true,
          createdAt: true,
          actor: { select: { name: true } },
        },
      },
    },
  });

  const dataByFormId = new Map<string, unknown>();
  if (isTypedList && forms.length > 0) {
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
        if (!isTypedList) return [];
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
      if (!isTypedList) return [];
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
          : isSuggestionList
            ? suggestionRows.length === 0
            : forms.length === 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      {!isTypedList ? (
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
          <div className="col-span-2">종류</div>
          <div className="col-span-3">제목</div>
          <div className="col-span-2">상태</div>
          <div className="col-span-2">작성자</div>
          <div className="col-span-2">댓글</div>
          <div className="col-span-1 text-right">일자</div>
        </div>
      ) : null}

      {isEmpty ? (
        <div className="px-4 py-10 text-center text-sm text-zinc-600">
          {isTypedList && forms.length > 0
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
      ) : isSuggestionList ? (
        <ReviewProcessFilterFormsTable
          storageKey={SUGGESTION_LIST_STORAGE_KEY}
          columns={SUGGESTION_LIST_COLUMNS}
          rows={suggestionRows}
          filterTitle="미처리"
          filterHint="(처리(예정)일자 없음)"
        />
      ) : (
        <ul className="divide-y divide-zinc-100">
          {forms.map((f) => {
            const commentCp = getCommentPreview(f.events[0], f.commentCount);
            return (
              <li key={f.id} className="px-4 py-3 hover:bg-zinc-50">
                <Link
                  href={`/forms/${f.id}`}
                  prefetch
                  className="grid grid-cols-12 gap-2"
                >
                  <div className="col-span-2 text-sm text-zinc-800">
                    {isFormTypeKey(f.type)
                      ? FORM_TYPE_LABEL[f.type]
                      : String(f.type)}
                  </div>
                  <div className="col-span-3 min-w-0 text-sm font-medium text-zinc-900">
                    {f.title}
                  </div>
                  <div className="col-span-2 text-sm text-zinc-700">
                    {statusLabel[String(f.status)] ?? String(f.status)}
                  </div>
                  <div className="col-span-2 text-sm text-zinc-700">
                    {f.createdBy.name}
                  </div>
                  <div className="col-span-2 min-w-0 text-xs text-zinc-700">
                    {commentCp ? (
                      <div
                        className="line-clamp-2 whitespace-pre-wrap"
                        title={commentCp.tooltip}
                      >
                        {commentCp.line}
                      </div>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </div>
                  <div className="col-span-1 text-right text-xs text-zinc-500">
                    {new Date(f.createdAt).toLocaleDateString()}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
