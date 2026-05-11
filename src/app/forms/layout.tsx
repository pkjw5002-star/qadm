import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { FORM_TYPES } from "@/lib/formTypes";

export default async function FormsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-none items-center justify-between px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-3">
          <div className="flex items-center gap-3">
            <Link href="/forms" className="text-sm font-semibold tracking-tight">
              QADM
            </Link>
            <span className="text-xs text-zinc-500">{user.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                관리자
              </Link>
            ) : null}
            <Link
              href="/forms/new"
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              서류작성
            </Link>
            <form action="/logout" method="post">
              <button
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                type="submit"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>

        <nav className="border-t border-zinc-100 bg-white">
          <div className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20">
            <div className="-mx-1 flex gap-1 overflow-x-auto py-2">
              <Link
                href="/forms"
                className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                전체
              </Link>
              {FORM_TYPES.map((t) => (
                <Link
                  key={t.key}
                  href={`/forms?type=${t.key}`}
                  className="shrink-0 rounded-xl px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  {t.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-none px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-6">
        {children}
      </main>
    </div>
  );
}

