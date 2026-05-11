"use client";

import { deleteFormAction } from "./actions";

export default function DeleteFormForm({ formId }: { formId: string }) {
  return (
    <form
      action={deleteFormAction}
      onSubmit={(e) => {
        if (
          !confirm(
            "이 서식을 삭제하면 복구할 수 없습니다. 댓글·이력까지 모두 삭제됩니다. 계속할까요?"
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="formId" value={formId} />
      <button
        type="submit"
        className="rounded-xl border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
      >
        삭제
      </button>
    </form>
  );
}
