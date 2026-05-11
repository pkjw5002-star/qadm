import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <Link
              href="/admin"
              className="text-sm font-semibold tracking-tight text-zinc-900"
            >
              QADM 관리
            </Link>
            <p className="truncate text-xs text-zinc-500">{user.name}</p>
          </div>
          <nav className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            <Link
              href="/admin/users"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              사용자
            </Link>
            <Link
              href="/admin/department-owners"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              부서/담당자
            </Link>
            <Link
              href="/forms"
              className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              서식으로
            </Link>
            <form action="/logout" method="post">
              <button
                type="submit"
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
              >
                로그아웃
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
