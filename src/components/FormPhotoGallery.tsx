import { photoRefToUrlList, type PhotoRef } from "@/lib/photoRef";

export default function FormPhotoGallery({
  photo,
  label = "사진첨부",
  legacyNote,
}: {
  photo?: PhotoRef | null;
  label?: string;
  legacyNote?: unknown;
}) {
  const urls = photoRefToUrlList(photo ?? undefined);
  if (urls.length === 0 && !legacyNote) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="space-y-3">
        {urls.map((url) => (
          <div key={url}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={label}
              className="max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm"
            />
          </div>
        ))}
        {legacyNote && urls.length === 0 ? (
          <div className="whitespace-pre-wrap rounded-xl border border-zinc-100 bg-white px-3 py-3 text-sm text-zinc-800 shadow-sm">
            {String(legacyNote)}
          </div>
        ) : null}
      </div>
    </div>
  );
}
