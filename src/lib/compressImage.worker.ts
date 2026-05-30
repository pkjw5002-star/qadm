/// <reference lib="webworker" />

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.72;

type InMsg = {
  id: string;
  buffer: ArrayBuffer;
  type: string;
  name: string;
};

type OutMsg = {
  id: string;
  buffer?: ArrayBuffer;
  type?: string;
  name?: string;
  error?: string;
};

self.onmessage = async (event: MessageEvent<InMsg>) => {
  const { id, buffer, type, name } = event.data;
  try {
    const blob = new Blob([buffer], { type });
    const bitmap = await createImageBitmap(blob, {
      resizeWidth: MAX_EDGE,
      resizeHeight: MAX_EDGE,
      resizeQuality: "medium",
    });

    const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      throw new Error("canvas");
    }
    ctx.drawImage(bitmap, 0, 0);
    bitmap.close();

    const outBlob = await canvas.convertToBlob({
      type: "image/jpeg",
      quality: JPEG_QUALITY,
    });
    const outBuffer = await outBlob.arrayBuffer();
    const base = name.replace(/\.[^.]+$/, "") || "photo";
    const out: OutMsg = {
      id,
      buffer: outBuffer,
      type: "image/jpeg",
      name: `${base}.jpg`,
    };
    self.postMessage(out, [outBuffer]);
  } catch {
    self.postMessage({ id, error: "compress" } satisfies OutMsg);
  }
};
