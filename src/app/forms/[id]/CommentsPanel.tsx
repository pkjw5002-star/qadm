"use client";

import { useActionState, useRef, type FormEvent } from "react";
import { addFormCommentAction } from "@/app/forms/[id]/actions";
import CommentAttachmentsField from "@/components/CommentAttachmentsField";
import {
  attachmentDisplayLabel,
  attachmentIsImage,
  type CommentAttachmentMeta,
} from "@/lib/commentAttachmentTypes";
import { isFirebaseConfigured } from "@/lib/firebase";
import {
  applyCommentAttachmentsToDom,
  COMMENT_ATTACHMENT_URL_FIELD,
  hasCommentAttachmentFiles,
  prepareCommentAttachmentsForSubmit,
} from "@/lib/prepareCommentAttachmentsForSubmit";

type CommentItem = {
  id: string;
  text: string;
  attachments: CommentAttachmentMeta[];
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
  const submitAfterUpload = useRef(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    async (_prev, formData) => {
      await addFormCommentAction(formData);
      return { ok: true };
    },
    undefined
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    if (submitAfterUpload.current) {
      submitAfterUpload.current = false;
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    if (isFirebaseConfigured() && hasCommentAttachmentFiles(formData)) {
      e.preventDefault();
      const prepared = await prepareCommentAttachmentsForSubmit(formData);
      if (!prepared.ok) {
        return;
      }
      applyCommentAttachmentsToDom(form, formData);
      submitAfterUpload.current = true;
      form.requestSubmit();
      return;
    }

    if (isFirebaseConfigured()) {
      const urls = formData.getAll(COMMENT_ATTACHMENT_URL_FIELD);
      const text = String(formData.get("comment") ?? "").trim();
      if (urls.length === 0 && !text) {
        e.preventDefault();
        return;
      }
    }
  }

  return (
    <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="text-sm font-medium text-zinc-900">댓글</div>
        <div className="mt-0.5 text-xs text-zinc-500">
          문서에 대한 논의·메모·파일(PDF 등)을 남길 수 있어요.
        </div>
      </div>

      <form action={action} onSubmit={handleSubmit} className="space-y-3 p-4">
        <input type="hidden" name="formId" value={formId} />
        <textarea
          name="comment"
          rows={3}
          placeholder="댓글을 입력하세요"
          className="w-full resize-y rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
        <CommentAttachmentsField />
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
              {c.text ? (
                <div className="whitespace-pre-wrap text-sm text-zinc-900">
                  {c.text}
                </div>
              ) : null}
              {c.attachments.length > 0 ? (
                <ul className={`space-y-2 ${c.text ? "mt-2" : ""}`}>
                  {c.attachments.map((att) => (
                    <li key={att.url}>
                      {attachmentIsImage(att) ? (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="block overflow-hidden rounded-lg border border-zinc-200"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={att.url}
                            alt={attachmentDisplayLabel(att)}
                            className="h-24 w-full object-cover"
                          />
                        </a>
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 hover:bg-zinc-100"
                        >
                          <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium">
                            {att.mime === "application/pdf" ? "PDF" : "파일"}
                          </span>
                          <span className="truncate underline">
                            {attachmentDisplayLabel(att)}
                          </span>
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}
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
