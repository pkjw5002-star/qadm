import { isFirebaseConfigured } from "@/lib/firebase";
import { uploadCommentAttachmentClient } from "@/lib/uploadCommentAttachmentClient";

export const COMMENT_ATTACHMENT_FILE_FIELD = "commentAttachmentFile";
export const COMMENT_ATTACHMENT_URL_FIELD = "commentAttachmentUrl";
export const COMMENT_ATTACHMENT_NAME_FIELD = "commentAttachmentName";
export const COMMENT_ATTACHMENT_MIME_FIELD = "commentAttachmentMime";

export function hasCommentAttachmentFiles(formData: FormData): boolean {
  for (const entry of formData.getAll(COMMENT_ATTACHMENT_FILE_FIELD)) {
    if (entry instanceof File && entry.size > 0) return true;
  }
  return false;
}

export function applyCommentAttachmentsToDom(
  form: HTMLFormElement,
  formData: FormData
): void {
  const fileEl = form.elements.namedItem(COMMENT_ATTACHMENT_FILE_FIELD);
  if (fileEl instanceof HTMLInputElement) {
    fileEl.value = "";
  }
  void formData;
}

export async function prepareCommentAttachmentsForSubmit(
  formData: FormData
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isFirebaseConfigured()) {
    return { ok: true };
  }

  const uploads: Promise<
    | {
        ok: true;
        url: string;
        name: string;
        mime: string;
      }
    | { ok: false; message: string }
  >[] = [];

  for (const entry of formData.getAll(COMMENT_ATTACHMENT_FILE_FIELD)) {
    if (!(entry instanceof File) || entry.size === 0) continue;
    uploads.push(
      uploadCommentAttachmentClient(entry).then((result) =>
        result.ok
          ? {
              ok: true as const,
              url: result.url,
              name: result.name ?? entry.name,
              mime: result.mime ?? entry.type,
            }
          : result
      )
    );
  }

  if (uploads.length === 0) return { ok: true };

  const results = await Promise.all(uploads);
  for (const result of results) {
    if (!result.ok) return result;
    const urls = formData.getAll(COMMENT_ATTACHMENT_URL_FIELD).map(String);
    if (!urls.includes(result.url)) {
      formData.append(COMMENT_ATTACHMENT_URL_FIELD, result.url);
      formData.append(COMMENT_ATTACHMENT_NAME_FIELD, result.name);
      formData.append(COMMENT_ATTACHMENT_MIME_FIELD, result.mime);
    }
  }
  formData.delete(COMMENT_ATTACHMENT_FILE_FIELD);

  return { ok: true };
}
