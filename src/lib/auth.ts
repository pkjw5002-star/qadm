import bcrypt from "bcryptjs";
import { cache } from "react";
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

export const requireUser = cache(async () => {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    redirect("/logout");
  }
  return user;
});

/** 관리자 전용 페이지. 미로그인은 `/admin/login`, 일반 사용자는 `/forms` */
export const requireAdmin = cache(async () => {
  const session = await getSession();
  if (!session.userId) redirect("/admin/login");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) redirect("/logout");
  if (user.role !== "ADMIN") redirect("/forms");
  return user;
});
