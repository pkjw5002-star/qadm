import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash);
}

export async function requireUser() {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    // Server Component에서는 쿠키 수정 불가 → Route Handler에서 destroy
    redirect("/logout");
  }
  return user;
}

/** 관리자 전용 페이지. 미로그인은 `/admin/login`, 일반 사용자는 `/forms` */
export async function requireAdmin() {
  const session = await getSession();
  if (!session.userId) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) redirect("/logout");
  if (user.role !== "ADMIN") redirect("/forms");
  return user;
}
