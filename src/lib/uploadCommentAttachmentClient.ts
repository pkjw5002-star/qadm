import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { compressImageFile } from "@/lib/compressImageFile";
import {
  type CommentAttachmentMeta,
  validateCommentAttachmentFile,
} from "@/lib/commentAttachmentTypes";
import { getFirebaseApp } from "@/lib/firebase";

/** 브라우저에서 Firebase Storage `comments/` 경로로 업로드 */
export async function uploadCommentAttachmentClient(
  file: File
): Promise<
  | ({ ok: true } & CommentAttachmentMeta)
  | { ok: false; message: string }
> {
  const validated = validateCommentAttachmentFile(file);
  if (!validated.ok) return validated;

  const app = getFirebaseApp();
  if (!app) {
    return {
      ok: false,
      message:
        "Firebase 설정이 없습니다. NEXT_PUBLIC_FIREBASE_* 환경 변수를 확인해 주세요.",
    };
  }

  try {
    const isImage = validated.mime.startsWith("image/");
    const toUpload = isImage ? await compressImageFile(file) : file;
    const mime = isImage ? toUpload.type || validated.mime : validated.mime;
    const ext =
      isImage && toUpload.type === "image/png"
        ? ".png"
        : isImage && toUpload.type === "image/jpeg"
          ? ".jpg"
          : validated.ext;

    const storage = getStorage(app);
    const objectPath = `comments/${crypto.randomUUID()}${ext}`;
    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, toUpload, { contentType: mime });
    const url = await getDownloadURL(storageRef);
    return {
      ok: true,
      url,
      name: file.name,
      mime,
    };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[comment attachment upload]", detail);
    if (/storage\/unauthorized|permission/i.test(detail)) {
      return {
        ok: false,
        message:
          "Storage 업로드 권한이 없습니다. storage.rules에 comments/ 규칙을 배포해 주세요. (docs/PHOTO_UPLOAD.md)",
      };
    }
    return {
      ok: false,
      message: "파일을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}
