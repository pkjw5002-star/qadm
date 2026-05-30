import DetailPhoto from "@/components/DetailPhoto";
import { photoRefToUrlList, type PhotoRef } from "@/lib/photoRef";

export default function FormPhotoGallery({
  photo,
  label = "사진첨부",
  legacyNote,
  hero = false,
}: {
  photo?: PhotoRef | null;
  label?: string;
  legacyNote?: unknown;
  /** 첫 이미지 우선 로드 (상세 상단 사진) */
  hero?: boolean;
}) {
  const urls = photoRefToUrlList(photo ?? undefined);
  if (urls.length === 0 && !legacyNote) return null;

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-zinc-500">{label}</div>
      <div className="space-y-3">
        {urls.map((url, i) => (
          <DetailPhoto
            key={url}
            src={url}
            alt={label}
            priority={hero && i === 0}
          />
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
