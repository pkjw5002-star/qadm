import { FORM_PHOTO_FIELD_PAIRS } from "@/lib/formPhotoFields";
import { isFirebaseConfigured } from "@/lib/firebase";
import { uploadFormPhotoClient } from "@/lib/uploadFormPhotoClient";

export function hasFormPhotoFiles(formData: FormData): boolean {
  return FORM_PHOTO_FIELD_PAIRS.some(({ fileField }) => {
    const entry = formData.get(fileField);
    return entry instanceof File && entry.size > 0;
  });
}

/** 업로드된 URL을 폼 input에 반영하고 file input은 비웁니다. */
export function applyFormPhotoFieldsToDom(
  form: HTMLFormElement,
  formData: FormData
): void {
  for (const { fileField, urlField } of FORM_PHOTO_FIELD_PAIRS) {
    const url = String(formData.get(urlField) ?? "").trim();
    if (url) {
      const urlEl = form.elements.namedItem(urlField);
      if (urlEl instanceof HTMLInputElement) {
        urlEl.value = url;
      }
    }
    const fileEl = form.elements.namedItem(fileField);
    if (fileEl instanceof HTMLInputElement) {
      fileEl.value = "";
    }
  }
}

/**
 * 제출 전 선택한 사진을 Firebase Storage에 올리고 URL 필드에 넣습니다.
 * 파일은 FormData에서 제거해 서버 액션 본문 크기·Vercel 디스크 제한을 피합니다.
 */
export async function prepareFormPhotosForSubmit(
  formData: FormData
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!isFirebaseConfigured()) {
    return { ok: true };
  }

  const uploads: Promise<
    | { ok: true; urlField: string; url: string; fileField: string }
    | { ok: false; message: string }
  >[] = [];

  for (const { fileField, urlField } of FORM_PHOTO_FIELD_PAIRS) {
    for (const entry of formData.getAll(fileField)) {
      if (!(entry instanceof File) || entry.size === 0) continue;
      uploads.push(
        uploadFormPhotoClient(entry).then((result) =>
          result.ok
            ? { ok: true as const, urlField, url: result.url, fileField }
            : result
        )
      );
    }
  }

  if (uploads.length === 0) return { ok: true };

  const results = await Promise.all(uploads);
  for (const result of results) {
    if (!result.ok) return result;
    const existing = formData.getAll(result.urlField).map(String);
    if (!existing.includes(result.url)) {
      formData.append(result.urlField, result.url);
    }
    formData.delete(result.fileField);
  }

  return { ok: true };
}
