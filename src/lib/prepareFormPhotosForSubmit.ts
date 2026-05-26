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

  for (const { fileField, urlField } of FORM_PHOTO_FIELD_PAIRS) {
    const entry = formData.get(fileField);
    if (!(entry instanceof File) || entry.size === 0) continue;

    const uploaded = await uploadFormPhotoClient(entry);
    if (!uploaded.ok) return uploaded;

    formData.set(urlField, uploaded.url);
    formData.delete(fileField);
  }

  return { ok: true };
}
