import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { compressImageFile } from "@/lib/compressImageFile";
import { getClientStorage } from "@/lib/firebaseStorageClient";
import { buildFirebasePublicUrl } from "@/lib/storagePublicUrl";

const MAX_BYTES = 8 * 1024 * 1024;

const MIME_EXT = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
]);

function validateImageFile(file: File):
  | { ok: true; ext: string; mime: string }
  | { ok: false; message: string } {
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "파일이 비어 있습니다." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, message: "파일 크기는 8MB 이하여야 합니다." };
  }
  const mime = file.type;
  const ext = MIME_EXT.get(mime);
  if (!ext) {
    return {
      ok: false,
      message: "JPG 또는 PNG 이미지만 업로드할 수 있습니다.",
    };
  }
  return { ok: true, ext, mime };
}

async function resolveUploadUrl(
  objectPath: string,
  storageRef: ReturnType<typeof ref>
): Promise<string> {
  const direct = buildFirebasePublicUrl(objectPath);
  if (direct) return direct;
  return getDownloadURL(storageRef);
}

export type UploadFormPhotoOptions = {
  skipCompress?: boolean;
};

/** 브라우저에서 Firebase Storage로 업로드 (Vercel·배포용) */
export async function uploadFormPhotoClient(
  file: File,
  options?: UploadFormPhotoOptions
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const validated = validateImageFile(file);
  if (!validated.ok) return validated;

  const storage = getClientStorage();
  if (!storage) {
    return {
      ok: false,
      message:
        "Firebase 설정이 없습니다. NEXT_PUBLIC_FIREBASE_* 환경 변수를 확인해 주세요.",
    };
  }

  try {
    const toUpload = options?.skipCompress
      ? file
      : await compressImageFile(file);
    const ext = toUpload.type === "image/png" ? ".png" : ".jpg";
    const mime =
      toUpload.type === "image/png" ? "image/png" : "image/jpeg";
    const objectPath = `forms/${crypto.randomUUID()}${ext}`;
    const storageRef = ref(storage, objectPath);
    await uploadBytes(storageRef, toUpload, { contentType: mime });
    const url = await resolveUploadUrl(objectPath, storageRef);
    return { ok: true, url };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[photo upload client]", detail);
    if (/storage\/unauthorized|permission/i.test(detail)) {
      return {
        ok: false,
        message:
          "Storage 업로드 권한이 없습니다. Firebase 콘솔에서 storage.rules를 배포해 주세요. (docs/PHOTO_UPLOAD.md)",
      };
    }
    return {
      ok: false,
      message: "사진을 업로드하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
}

export async function compressAndUploadFormPhoto(
  file: File
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const compressed = await compressImageFile(file);
  return uploadFormPhotoClient(compressed, { skipCompress: true });
}
