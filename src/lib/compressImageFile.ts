const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.72;
/** 이미 작은 JPEG는 디코드·압축 생략 */
const SKIP_BYTES = 800_000;

let worker: Worker | null = null;
let workerDisabled = false;

async function compressOnMainThread(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file, {
    resizeWidth: MAX_EDGE,
    resizeHeight: MAX_EDGE,
    resizeQuality: "medium",
  });

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
}

async function compressWithWorker(file: File): Promise<File | null> {
  if (workerDisabled || typeof Worker === "undefined") return null;

  try {
    if (!worker) {
      worker = new Worker(
        new URL("./compressImage.worker.ts", import.meta.url)
      );
    }

    const buffer = await file.arrayBuffer();
    const id = crypto.randomUUID();

    return new Promise((resolve) => {
      const onMessage = (event: MessageEvent) => {
        if (event.data?.id !== id) return;
        worker?.removeEventListener("message", onMessage);
        if (event.data.error || !event.data.buffer) {
          resolve(null);
          return;
        }
        resolve(
          new File([event.data.buffer], event.data.name, {
            type: event.data.type,
          })
        );
      };
      worker?.addEventListener("message", onMessage);
      worker?.postMessage(
        { id, buffer, type: file.type, name: file.name },
        [buffer]
      );
    });
  } catch {
    workerDisabled = true;
    worker?.terminate();
    worker = null;
    return null;
  }
}

/** 업로드 전 리사이즈·압축 (Worker 우선, 실패 시 메인 스레드) */
export async function compressImageFile(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }
  if (file.type === "image/jpeg" && file.size < SKIP_BYTES) {
    return file;
  }

  try {
    const fromWorker = await compressWithWorker(file);
    if (fromWorker && fromWorker.size < file.size) {
      return fromWorker;
    }
    const fromMain = await compressOnMainThread(file);
    if (fromMain.size < file.size) return fromMain;
    return file;
  } catch {
    return file;
  }
}
