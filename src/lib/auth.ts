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
    session.destroy();
    redirect("/login");
  }
  return user;
}

