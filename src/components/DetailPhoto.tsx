"use client";

import { useState } from "react";

const IMG_CLASS =
  "max-h-72 w-auto max-w-full rounded-xl border border-zinc-200 shadow-sm";

export default function DetailPhoto({
  src,
  alt,
  priority = false,
  className = IMG_CLASS,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative min-h-[8rem]">
      {!loaded && !failed ? (
        <div
          className="absolute inset-0 max-h-72 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100"
          aria-hidden
        />
      ) : null}
      {failed ? (
        <p className="text-sm text-zinc-500">이미지를 불러오지 못했습니다.</p>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`${className}${loaded ? "" : " opacity-0"}`}
          fetchPriority={priority ? "high" : undefined}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            setLoaded(true);
          }}
        />
      )}
    </div>
  );
}
