import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold tracking-tight">관리자 홈</h1>
      <p className="text-sm text-zinc-600">
        사용자 계정을 등록하고, 불만신고서 접수 시 사용할 부서/담당자 목록을
        관리합니다.
      </p>
      <ul className="list-inside list-disc space-y-2 text-sm text-zinc-800">
        <li>
          <Link className="font-medium text-sky-800 underline" href="/admin/users">
            사용자 등록·목록
          </Link>
        </li>
        <li>
          <Link
            className="font-medium text-sky-800 underline"
            href="/admin/department-owners"
          >
            부서/담당자 목록
          </Link>
        </li>
      </ul>
    </div>
  );
}
