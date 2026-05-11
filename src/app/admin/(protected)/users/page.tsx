import { prisma } from "@/lib/prisma";
import UsersRegisterForm from "@/app/admin/(protected)/users/UsersRegisterForm";
import UserRowEditor from "@/app/admin/(protected)/users/UserRowEditor";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ created?: string; updated?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const created = sp.created === "1";
  const updated = sp.updated === "1";

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">사용자</h1>
        <p className="mt-1 text-sm text-zinc-600">
          직원 계정을 등록하고, 이름·권한·비밀번호를 수정할 수 있습니다. 이메일은
          변경할 수 없습니다.
        </p>
      </div>

      {created ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          사용자를 등록했습니다.
        </div>
      ) : null}
      {updated ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          사용자 정보를 저장했습니다.
        </div>
      ) : null}

      <UsersRegisterForm />

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-2 text-xs font-medium text-zinc-600">
          등록된 사용자 ({users.length}명)
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-600">
                <th className="px-4 py-2">이메일</th>
                <th className="px-4 py-2" colSpan={2}>
                  수정 (이름·권한·비밀번호)
                </th>
                <th className="hidden px-4 py-2 sm:table-cell">등록일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <UserRowEditor
                  key={u.id}
                  user={{
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    role: u.role,
                    createdLabel: u.createdAt.toLocaleDateString("ko-KR"),
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
