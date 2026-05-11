import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  addDepartmentOwnerOptionAction,
  deleteDepartmentOwnerOptionAction,
} from "@/app/forms/settings/department-owners/actions";

export default async function DepartmentOwnersSettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const err = (await searchParams)?.error;

  const options = await prisma.departmentOwnerOption.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            부서 / 담당자 목록
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            불만신고서 접수 시 선택에 사용됩니다. 새 서식 화면에서는 목록만 적용되며,
            여기서 추가·삭제할 수 있습니다.
          </p>
        </div>
        <Link
          href="/forms/new?type=COMPLAINT"
          className="text-sm font-medium text-zinc-900 underline"
        >
          새 서식으로
        </Link>
      </div>

      {err === "empty" ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          항목 내용을 입력해 주세요.
        </div>
      ) : null}

      <form
        action={addDepartmentOwnerOptionAction}
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-zinc-200 bg-white p-4"
      >
        <label className="block min-w-[200px] flex-1">
          <span className="text-sm font-medium text-zinc-800">항목 추가</span>
          <input
            name="label"
            required
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
            placeholder="예: 품질팀 홍길동"
          />
        </label>
        <button
          type="submit"
          className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
        >
          저장
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
          등록된 항목 ({options.length}건)
        </div>
        {options.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-zinc-600">
            등록된 항목이 없습니다. 위에서 추가해 주세요.
          </div>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {options.map((o) => (
              <li
                key={o.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <span className="text-sm text-zinc-900">{o.label}</span>
                <form action={deleteDepartmentOwnerOptionAction}>
                  <input type="hidden" name="id" value={o.id} />
                  <button
                    type="submit"
                    className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
