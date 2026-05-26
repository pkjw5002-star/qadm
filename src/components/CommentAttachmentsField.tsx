"use client";

import { useCallback, useState } from "react";
import {
  type CommentAttachmentMeta,
  COMMENT_ATTACHMENT_ACCEPT,
  attachmentDisplayLabel,
  attachmentIsImage,
} from "@/lib/commentAttachmentTypes";
import {
  COMMENT_ATTACHMENT_MIME_FIELD,
  COMMENT_ATTACHMENT_NAME_FIELD,
  COMMENT_ATTACHMENT_URL_FIELD,
} from "@/lib/prepareCommentAttachmentsForSubmit";
import { isFirebaseConfigured } from "@/lib/firebase";
import { uploadCommentAttachmentClient } from "@/lib/uploadCommentAttachmentClient";

const MAX_ATTACHMENTS = 10;

export default function CommentAttachmentsField() {
  const [items, setItems] = useState<CommentAttachmentMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.size > 0);
    if (list.length === 0) return;

    if (!isFirebaseConfigured()) {
      setError(
        "Firebase가 설정되지 않았습니다. 파일은 Firebase 설정 후 업로드할 수 있습니다."
      );
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const results = await Promise.all(
        list.map((f) => uploadCommentAttachmentClient(f))
      );
      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) {
        setError(failed.message);
        return;
      }
      const added = results
        .filter((r): r is { ok: true } & CommentAttachmentMeta => r.ok)
        .map((r) => ({ url: r.url, name: r.name, mime: r.mime }));

      setItems((prev) => {
        const merged = [...prev];
        for (const a of added) {
          if (!merged.some((m) => m.url === a.url)) merged.push(a);
        }
        return merged.slice(0, MAX_ATTACHMENTS);
      });
    } finally {
      setUploading(false);
    }
  }, []);

  function removeAt(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-zinc-800">파일 첨부 (선택)</span>
      <p className="text-xs text-zinc-500">
        JPG·PNG·PDF·Word·Excel, 파일당 8MB 이하, 최대 {MAX_ATTACHMENTS}개.
        선택 즉시 업로드됩니다.
      </p>

      {items.length > 0 ? (
        <ul className="space-y-2">
          {items.map((att, i) => (
            <li
              key={`${att.url}-${i}`}
              className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2"
            >
              {attachmentIsImage(att) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={att.url}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-zinc-200 text-xs font-medium text-zinc-700">
                  {att.mime === "application/pdf" ? "PDF" : "DOC"}
                </span>
              )}
              <a
                href={att.url}
                target="_blank"
                rel="noreferrer"
                className="min-w-0 flex-1 truncate text-sm text-zinc-800 underline"
              >
                {attachmentDisplayLabel(att)}
              </a>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="shrink-0 rounded-md px-2 py-1 text-xs text-red-600 hover:bg-red-50"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        name="commentAttachmentFile"
        type="file"
        accept={COMMENT_ATTACHMENT_ACCEPT}
        multiple
        disabled={uploading}
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) void uploadFiles(files);
          e.target.value = "";
        }}
        className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-50"
      />

      {uploading ? (
        <p className="text-xs text-zinc-600">파일 업로드 중…</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}

      {items.map((att, i) => (
        <span key={`hidden-${att.url}-${i}`}>
          <input
            type="hidden"
            name={COMMENT_ATTACHMENT_URL_FIELD}
            value={att.url}
          />
          <input
            type="hidden"
            name={COMMENT_ATTACHMENT_NAME_FIELD}
            value={att.name ?? ""}
          />
          <input
            type="hidden"
            name={COMMENT_ATTACHMENT_MIME_FIELD}
            value={att.mime ?? ""}
          />
        </span>
      ))}
    </div>
  );
}
