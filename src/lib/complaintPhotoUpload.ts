import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_BYTES = 8 * 1024 * 1024;

const MIME_EXT = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
]);

export async function saveComplaintPhotoUpload(file: File): Promise<
  | { ok: true; publicPath: string }
  | { ok: false; message: string }
> {
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

  const dir = path.join(process.cwd(), "public", "uploads", "complaints");
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}${ext}`;
  const diskPath = path.join(dir, filename);
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, buf);

  return { ok: true, publicPath: `/uploads/complaints/${filename}` };
}
