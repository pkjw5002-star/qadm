import { isFirebaseConfigured } from "@/lib/firebase";
import { runWithConcurrency } from "@/lib/runWithConcurrency";

export const COMMENT_ATTACHMENT_FILE_FIELD = "commentAttachmentFile";
export const COMMENT_ATTACHMENT_URL_FIELD = "commentAttachmentUrl";
export const COMMENT_ATTACHMENT_NAME_FIELD = "commentAttachmentName";
export const COMMENT_ATTACHMENT_MIME_FIELD = "commentAttachmentMime";

const UPLOAD_CONCURRENCY = 3;

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

  const files: File[] = [];
  for (const entry of formData.getAll(COMMENT_ATTACHMENT_FILE_FIELD)) {
    if (entry instanceof File && entry.size > 0) files.push(entry);
  }

  if (files.length === 0) return { ok: true };

  const { uploadCommentAttachmentClient } = await import(
    "@/lib/uploadCommentAttachmentClient"
  );

  const results = await runWithConcurrency(
    files,
    UPLOAD_CONCURRENCY,
    (entry) => uploadCommentAttachmentClient(entry)
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const entry = files[i];
    if (!result.ok) return result;
    const urls = formData.getAll(COMMENT_ATTACHMENT_URL_FIELD).map(String);
    if (!urls.includes(result.url)) {
      formData.append(COMMENT_ATTACHMENT_URL_FIELD, result.url);
      formData.append(
        COMMENT_ATTACHMENT_NAME_FIELD,
        result.name ?? entry.name
      );
      formData.append(
        COMMENT_ATTACHMENT_MIME_FIELD,
        result.mime ?? entry.type
      );
    }
  }
  formData.delete(COMMENT_ATTACHMENT_FILE_FIELD);

  return { ok: true };
}
