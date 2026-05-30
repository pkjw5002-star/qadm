"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { prewarmFirebaseUpload } from "@/lib/prewarmFirebaseUpload";
import { photoRefToUrlList, type PhotoRef } from "@/lib/photoRef";
import { runWithConcurrency } from "@/lib/runWithConcurrency";

const UPLOAD_CONCURRENCY = 5;

type PhotoSlot = {
  key: string;
  previewSrc: string;
  storedUrl?: string;
  pending: boolean;
};

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
  const blobUrlsRef = useRef<Set<string>>(new Set());

  const [slots, setSlots] = useState<PhotoSlot[]>(() =>
    initialUrls.map((url) => ({
      key: url,
      previewSrc: url,
      storedUrl: url,
      pending: false,
    }))
  );
  const [cleared, setCleared] = useState(false);
  const markRemoved =
    cleared ||
    (slots.every((s) => !s.storedUrl) && initialUrls.length > 0);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isFirebaseConfigured()) prewarmFirebaseUpload();
  }, []);

  useEffect(() => {
    return () => {
      for (const u of blobUrlsRef.current) URL.revokeObjectURL(u);
      blobUrlsRef.current.clear();
    };
  }, []);

  const replaceSlot = useCallback(
    (key: string, storedUrl: string, revokePreview?: string) => {
      if (revokePreview?.startsWith("blob:")) {
        URL.revokeObjectURL(revokePreview);
        blobUrlsRef.current.delete(revokePreview);
      }
      setSlots((prev) =>
        prev.map((s) =>
          s.key === key
            ? { key: storedUrl, previewSrc: storedUrl, storedUrl, pending: false }
            : s
        )
      );
    },
    []
  );

  const uploadFiles = useCallback(
    async (files: FileList | File[]) => {
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
      setUploadProgress({ done: 0, total: list.length });
      setCleared(false);

      const pendingSlots: PhotoSlot[] = list.map((f) => {
        const previewSrc = URL.createObjectURL(f);
        blobUrlsRef.current.add(previewSrc);
        return {
          key: previewSrc,
          previewSrc,
          pending: true,
        };
      });
      setSlots((prev) => [...prev, ...pendingSlots].slice(0, 20));

      try {
        const { compressAndUploadFormPhoto } = await import(
          "@/lib/uploadFormPhotoClient"
        );

        const results = await runWithConcurrency(
          list.map((file, i) => ({ file, slot: pendingSlots[i] })),
          UPLOAD_CONCURRENCY,
          async ({ file, slot }) => {
            const result = await compressAndUploadFormPhoto(file);
            if (result.ok) {
              replaceSlot(slot.key, result.url, slot.previewSrc);
            } else {
              URL.revokeObjectURL(slot.previewSrc);
              blobUrlsRef.current.delete(slot.previewSrc);
              setSlots((prev) => prev.filter((s) => s.key !== slot.key));
            }
            setUploadProgress((p) =>
              p ? { done: p.done + 1, total: p.total } : null
            );
            return result;
          }
        );

        const failed = results.find((r) => !r.ok);
        if (failed && !failed.ok) {
          setError(failed.message);
        }
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    },
    [replaceSlot]
  );

  function removeAt(index: number) {
    setSlots((prev) => {
      const target = prev[index];
      if (target?.previewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(target.previewSrc);
        blobUrlsRef.current.delete(target.previewSrc);
      }
      return prev.filter((_, i) => i !== index);
    });
  }

  function removeAll() {
    for (const s of slots) {
      if (s.previewSrc.startsWith("blob:")) {
        URL.revokeObjectURL(s.previewSrc);
        blobUrlsRef.current.delete(s.previewSrc);
      }
    }
    setSlots([]);
    setCleared(true);
    setError(null);
  }

  const storedUrls = slots
    .map((s) => s.storedUrl)
    .filter((u): u is string => Boolean(u));

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <p className="text-xs text-zinc-500">
        JPG·PNG 여러 장 선택 가능. 선택 즉시 업로드됩니다. URL 직접 입력도
        가능합니다.
      </p>

      {slots.length > 0 ? (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {slots.map((slot, i) => (
            <li
              key={slot.key}
              className="relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={slot.previewSrc}
                alt={`첨부 ${i + 1}`}
                className={`h-28 w-full object-cover ${slot.pending ? "opacity-70" : ""}`}
              />
              {slot.pending ? (
                <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-white">
                  업로드 중
                </span>
              ) : null}
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

      {uploading && uploadProgress ? (
        <p className="text-xs text-zinc-600">
          사진 업로드 중… ({uploadProgress.done}/{uploadProgress.total})
        </p>
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
            setSlots((prev) => {
              const merged = [...prev];
              for (const line of lines) {
                if (merged.some((s) => s.storedUrl === line)) continue;
                merged.push({
                  key: line,
                  previewSrc: line,
                  storedUrl: line,
                  pending: false,
                });
              }
              return merged.slice(0, 20);
            });
            e.target.value = "";
            setCleared(false);
          }}
        />
      </label>

      {storedUrls.map((url, i) => (
        <input key={`${urlField}-${i}`} type="hidden" name={urlField} value={url} />
      ))}
      <input type="hidden" name={removeField} value={markRemoved ? "1" : "0"} />

      {slots.length > 0 ? (
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
