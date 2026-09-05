"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { FORM_TYPES } from "@/lib/formTypes";

function tabClass(active: boolean): string {
  if (active) {
    return "shrink-0 rounded-xl bg-zinc-900 px-3.5 py-2 text-base font-semibold text-white shadow-sm";
  }
  return "shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900";
}

export default function FormsBoardNav({
  isAdmin,
}: {
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const type = searchParams.get("type");

  const onFormsList = pathname === "/forms";
  const view = searchParams.get("view");
  const allActive = onFormsList && !type && view !== "recent";
  const recentActive = onFormsList && !type && view === "recent";

  return (
    <div className="mx-auto flex w-full max-w-none items-center gap-3 px-4 py-2 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
      <nav className="min-w-0 flex-1">
        <div className="-mx-1 flex items-center gap-1 overflow-x-auto">
          <Link href="/forms" prefetch className={tabClass(allActive)}>
            전체
          </Link>
          <Link
            href="/forms?view=recent"
            prefetch
            className={tabClass(recentActive)}
          >
            최근게시글
          </Link>
          {FORM_TYPES.map((t) => (
            <Link
              key={t.key}
              href={`/forms?type=${t.key}`}
              prefetch
              className={tabClass(onFormsList && type === t.key)}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {isAdmin ? (
          <Link
            href="/admin"
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 sm:px-3 sm:text-sm"
          >
            관리자
          </Link>
        ) : null}
        <Link
          href="/forms/new"
          className="rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 sm:px-3 sm:text-sm"
        >
          서류작성
        </Link>
        <form action="/logout" method="post">
          <button
            className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-50 sm:px-3 sm:text-sm"
            type="submit"
          >
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
