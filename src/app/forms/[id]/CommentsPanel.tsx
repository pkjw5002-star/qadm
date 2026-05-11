"use client";

import { useActionState } from "react";
import { addFormCommentAction } from "@/app/forms/[id]/actions";

type CommentItem = {
  id: string;
  text: string;
  actorName: string;
  createdAt: string;
};

type ActionState = { ok: false; message: string } | { ok: true } | undefined;

export default function CommentsPanel({
  formId,
  comments,
}: {
  formId: string;
  comments: CommentItem[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      await addFormCommentAction(formData);
      return { ok: true };
    },
    undefined
  );

  return (
    <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="text-sm font-medium text-zinc-900">댓글</div>
        <div className="mt-0.5 text-xs text-zinc-500">
          문서에 대한 논의/메모를 남길 수 있어요.
        </div>
      </div>

      <form action={action} className="space-y-2 p-4">
        <input type="hidden" name="formId" value={formId} />
        <textarea
          name="comment"
          rows={3}
          placeholder="댓글을 입력하세요"
          className="w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-zinc-500">
            {pending ? "저장 중…" : null}
            {state && "message" in state ? state.message : null}
          </div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          >
            등록
          </button>
        </div>
      </form>

      <div className="border-t border-zinc-200" />

      <ul className="divide-y divide-zinc-100">
        {comments.length === 0 ? (
          <li className="px-4 py-8 text-center text-sm text-zinc-600">
            아직 댓글이 없어요.
          </li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="whitespace-pre-wrap text-sm text-zinc-900">
                {c.text}
              </div>
              <div className="mt-1 text-xs text-zinc-600">
                {c.actorName} · {c.createdAt}
              </div>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

