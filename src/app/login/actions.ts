"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";

const LoginSchema = z.object({
  name: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = LoginSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false as const, message: "이름/비밀번호를 확인해 주세요." };
  }

  const user = await prisma.user.findUnique({
    where: { name: parsed.data.name },
  });
  if (!user) return { ok: false as const, message: "계정을 찾을 수 없어요." };

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { ok: false as const, message: "이름/비밀번호가 틀렸어요." };

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect(user.role === "ADMIN" ? "/admin" : "/forms");
}
