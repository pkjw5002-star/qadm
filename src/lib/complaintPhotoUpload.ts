import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  getFirebaseStorageBucket,
  isFirebaseAdminConfigured,
} from "@/lib/firebaseAdmin";

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

async function saveToLocalDisk(
  file: File,
  ext: string
): Promise<{ ok: true; publicPath: string } | { ok: false; message: string }> {
  const dir = path.join(process.cwd(), "public", "uploads", "complaints");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const diskPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buf);

  return { ok: true, publicPath: `/uploads/complaints/${filename}` };
}

async function saveToFirebaseStorage(
  file: File,
  ext: string,
  mime: string
): Promise<{ ok: true; publicPath: string } | { ok: false; message: string }> {
  try {
    const bucket = getFirebaseStorageBucket();
    const objectPath = `forms/${randomUUID()}${ext}`;
    const downloadToken = randomUUID();
    const buf = Buffer.from(await file.arrayBuffer());

    await bucket.file(objectPath).save(buf, {
      metadata: {
        contentType: mime,
        metadata: {
          firebaseStorageDownloadTokens: downloadToken,
        },
      },
    });

    const encoded = encodeURIComponent(objectPath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encoded}?alt=media&token=${downloadToken}`;

    return { ok: true, publicPath: url };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[photo upload] Firebase Storage failed:", detail);
    return {
      ok: false,
      message:
        "사진을 클라우드에 저장하지 못했습니다. Firebase Storage 설정을 확인해 주세요.",
    };
  }
}

/** 서식 첨부 사진 저장 (로컬 public 또는 Firebase Storage) */
export async function saveComplaintPhotoUpload(file: File): Promise<
  | { ok: true; publicPath: string }
  | { ok: false; message: string }
> {
  const validated = validateImageFile(file);
  if (!validated.ok) return validated;

  if (isFirebaseAdminConfigured()) {
    return saveToFirebaseStorage(file, validated.ext, validated.mime);
  }

  if (process.env.VERCEL === "1") {
    return {
      ok: false,
      message:
        "배포 환경에서는 Firebase Storage 서비스 계정이 필요합니다. FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY를 Vercel 환경 변수에 추가해 주세요. (docs/PHOTO_UPLOAD.md)",
    };
  }

  try {
    return await saveToLocalDisk(file, validated.ext);
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    console.error("[photo upload] local save failed:", detail);
    return { ok: false, message: "사진 파일을 저장하지 못했습니다." };
  }
}
