export type CommentAttachmentMeta = {
  url: string;
  name?: string;
  mime?: string;
};

export const COMMENT_ATTACHMENT_MAX_BYTES = 8 * 1024 * 1024;

/** 댓글 첨부 허용 MIME → 확장자 */
export const COMMENT_ATTACHMENT_MIME_EXT = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["application/pdf", ".pdf"],
  [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".docx",
  ],
  [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xlsx",
  ],
  ["application/msword", ".doc"],
  ["application/vnd.ms-excel", ".xls"],
]);

export const COMMENT_ATTACHMENT_ACCEPT =
  "image/jpeg,image/png,.jpg,.jpeg,.png,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.ms-excel";

export function validateCommentAttachmentFile(file: File):
  | { ok: true; ext: string; mime: string }
  | { ok: false; message: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "파일이 비어 있습니다." };
  }
  if (file.size > COMMENT_ATTACHMENT_MAX_BYTES) {
    return { ok: false, message: "파일 크기는 8MB 이하여야 합니다." };
  }
  const mime = file.type;
  const ext = COMMENT_ATTACHMENT_MIME_EXT.get(mime);
  if (!ext) {
    return {
      ok: false,
      message:
        "JPG·PNG·PDF·Word(.doc/.docx)·Excel(.xls/.xlsx)만 업로드할 수 있습니다.",
    };
  }
  return { ok: true, ext, mime };
}

export function attachmentIsImage(att: CommentAttachmentMeta): boolean {
  if (att.mime?.startsWith("image/")) return true;
  return /\.(jpe?g|png|gif|webp)(\?|$)/i.test(att.url);
}

export function attachmentDisplayLabel(att: CommentAttachmentMeta): string {
  if (att.name?.trim()) return att.name.trim();
  if (att.mime === "application/pdf") return "PDF";
  if (att.mime?.includes("wordprocessingml") || att.mime === "application/msword")
    return "Word";
  if (att.mime?.includes("spreadsheetml") || att.mime === "application/vnd.ms-excel")
    return "Excel";
  if (att.mime?.startsWith("image/")) return "이미지";
  return "첨부 파일";
}
