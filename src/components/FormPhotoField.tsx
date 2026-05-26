"use client";

import { useCallback, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { compressImageFile } from "@/lib/compressImageFile";
import { photoRefToUrlList, type PhotoRef } from "@/lib/photoRef";
import { runWithConcurrency } from "@/lib/runWithConcurrency";

const UPLOAD_CONCURRENCY = 3;

type FormPhotoFieldProps = {
  label?: string;
  fileField: string;
  urlField: string;
  removeField: string;
  defaultPhoto?: PhotoRef | null;
};

export default function FormPhotoField({
  label = "관련사진",
  fileField,
  urlField,
  removeField,
  defaultPhoto,
}: FormPhotoFieldProps) {
  const initialUrls = photoRefToUrlList(defaultPhoto);
  const [urls, setUrls] = useState<string[]>(() => [...initialUrls]);
  const [cleared, setCleared] = useState(false);
  const markRemoved =
    cleared || (urls.length === 0 && initialUrls.length > 0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.size > 0);
    if (list.length === 0) return;

    if (!isFirebaseConfigured()) {
      setError(
        "Firebase가 설정되지 않았습니다. 사진은 저장 시 서버로 전송됩니다."
      );
      return;
    }

    setError(null);
    setUploading(true);
    setCleared(false);

    try {
      const compressed = await runWithConcurrency(
        list,
        UPLOAD_CONCURRENCY,
        (f) => compressImageFile(f)
      );
      const { uploadFormPhotoClient } = await import(
        "@/lib/uploadFormPhotoClient"
      );
      const results = await runWithConcurrency(
        compressed,
        UPLOAD_CONCURRENCY,
        (f) => uploadFormPhotoClient(f, { skipCompress: true })
      );
      const failed = results.find((r) => !r.ok);
      if (failed && !failed.ok) {
        setError(failed.message);
        return;
      }
      const newUrls = results
        .filter((r): r is { ok: true; url: string } => r.ok)
        .map((r) => r.url);
      setUrls((prev) => {
        const merged = [...prev];
        for (const u of newUrls) {
          if (!merged.includes(u)) merged.push(u);
        }
        return merged.slice(0, 20);
      });
    } finally {
      setUploading(false);
    }
  }, []);

  function removeAt(index: number) {
    setUrls((prev) => prev.filter((_, i) => i !== index));
  }

  function removeAll() {
    setUrls([]);
    setCleared(true);
    setError(null);
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <p className="text-xs text-zinc-500">
        JPG·PNG 여러 장 선택 가능. 선택 즉시 업로드됩니다. URL 직접 입력도
        가능합니다.
      </p>

      {urls.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {urls.map((url, i) => (
            <li
              key={`${url}-${i}`}
              className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`첨부 ${i + 1}`}
                className="h-28 w-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white hover:bg-black/80"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <input
        name={fileField}
        type="file"
        accept="image/jpeg,image/png,.jpg,.jpeg,.png"
        multiple
        disabled={uploading}
        onChange={(e) => {
          const files = e.target.files;
          if (files?.length) void uploadFiles(files);
          e.target.value = "";
        }}
        className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-50"
      />

      {uploading ? (
        <p className="text-xs text-zinc-600">사진 업로드 중…</p>
      ) : null}
      {error ? (
        <p className="text-xs text-red-600">{error}</p>
      ) : null}

      <label className="block">
        <span className="text-sm text-zinc-700">이미지 URL (선택, 한 줄에 하나)</span>
        <textarea
          name={`${urlField}Manual`}
          rows={2}
          defaultValue=""
          placeholder="https://example.com/a.png"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
          onBlur={(e) => {
            const lines = e.target.value
              .split(/\r?\n/)
              .map((s) => s.trim())
              .filter(Boolean);
            if (lines.length === 0) return;
            setUrls((prev) => {
              const merged = [...prev];
              for (const line of lines) {
                if (!merged.includes(line)) merged.push(line);
              }
              return merged.slice(0, 20);
            });
            e.target.value = "";
            setCleared(false);
          }}
        />
      </label>

      {urls.map((url, i) => (
        <input key={`${urlField}-${i}`} type="hidden" name={urlField} value={url} />
      ))}
      <input type="hidden" name={removeField} value={markRemoved ? "1" : "0"} />

      {urls.length > 0 ? (
        <button
          type="button"
          onClick={removeAll}
          className="text-xs font-medium text-red-600 underline"
        >
          이 항목 사진 전부 삭제
        </button>
      ) : null}
    </div>
  );
}
