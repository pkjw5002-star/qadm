/** 서식·댓글 첨부용 — 화면 표시에 충분한 크기로 빠르게 압축 */
const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.75;
/** 이미 작은 JPEG는 디코드·압축 생략 */
const SKIP_BYTES = 600_000;

/** 업로드 전 리사이즈·압축 (용량·전송 시간 절감) */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  if (file.type === "image/jpeg" && file.size < SKIP_BYTES) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file, {
      resizeWidth: MAX_EDGE,
      resizeHeight: MAX_EDGE,
      resizeQuality: "medium",
    });

    if (
      file.type === "image/jpeg" &&
      file.size < SKIP_BYTES &&
      bitmap.width <= MAX_EDGE &&
      bitmap.height <= MAX_EDGE
    ) {
      bitmap.close();
      return file;
    }

    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY);
    });
    if (!blob || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
