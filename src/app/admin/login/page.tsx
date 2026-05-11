import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import AdminLoginClient from "@/app/admin/login/AdminLoginClient";

export default async function AdminLoginPage() {
  const session = await getSession();
  if (session.userId) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    });
    if (user?.role === "ADMIN") {
      redirect("/admin");
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-100 p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">관리자 로그인</h1>
          <p className="mt-1 text-sm text-zinc-600">
            사용자 등록·부서/담당자 설정은 관리자만 이용할 수 있습니다.
          </p>
        </div>
        <AdminLoginClient />
        <div className="mt-6 space-y-2 text-sm text-zinc-600">
          <p>
            일반 직원 로그인은{" "}
            <Link className="font-medium text-zinc-900 underline" href="/login">
              직원 로그인
            </Link>
            으로 이동하세요.
          </p>
        </div>
      </div>
    </div>
  );
}
