export type PhotoRef = {
  uploadedUrl?: string;
  externalUrl?: string;
  /** 한 칸에 2장 이상 */
  extraUploadedUrls?: string[];
};

export function photoRefToUrlList(ref?: PhotoRef | null): string[] {
  if (!ref) return [];
  const urls: string[] = [];
  if (ref.uploadedUrl?.trim()) urls.push(ref.uploadedUrl.trim());
  if (ref.externalUrl?.trim()) {
    const ext = ref.externalUrl.trim();
    if (!urls.includes(ext)) urls.push(ext);
  }
  for (const u of ref.extraUploadedUrls ?? []) {
    const t = u?.trim();
    if (t && !urls.includes(t)) urls.push(t);
  }
  return urls;
}

function isFirebaseStorageUrl(url: string): boolean {
  return /firebasestorage\.googleapis\.com/i.test(url);
}

/** URL 목록 → DB용 PhotoRef (최대 20장) */
export function urlsToPhotoRef(urls: string[]): PhotoRef | undefined {
  const unique = [...new Set(urls.map((u) => u.trim()).filter(Boolean))].slice(
    0,
    20
  );
  if (unique.length === 0) return undefined;

  const uploaded: string[] = [];
  const external: string[] = [];
  for (const url of unique) {
    if (isFirebaseStorageUrl(url)) uploaded.push(url);
    else external.push(url);
  }

  const primaryUploaded = uploaded[0];
  const primaryExternal = external[0];
  const extra: string[] = [
    ...uploaded.slice(1),
    ...external.slice(primaryExternal ? 1 : 0),
  ];
  if (primaryExternal && !primaryUploaded) {
    return {
      externalUrl: primaryExternal,
      ...(extra.length ? { extraUploadedUrls: extra } : {}),
    };
  }
  if (primaryUploaded) {
    return {
      uploadedUrl: primaryUploaded,
      ...(primaryExternal ? { externalUrl: primaryExternal } : {}),
      ...(extra.length ? { extraUploadedUrls: extra } : {}),
    };
  }
  return undefined;
}

export function photoRefToUrlFieldValue(ref?: PhotoRef | null): string {
  return photoRefToUrlList(ref).join("\n");
}
