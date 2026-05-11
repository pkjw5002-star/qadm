import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

/** 예전 주소 호환: 관리자는 새 관리 화면으로 보냄 */
export default async function LegacyDepartmentOwnersRedirect() {
  const user = await requireUser();
  redirect(
    user.role === "ADMIN"
      ? "/admin/department-owners"
      : "/forms"
  );
}
