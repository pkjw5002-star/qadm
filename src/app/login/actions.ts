"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { verifyPassword } from "@/lib/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function loginAction(_: unknown, formData: FormData) {
  const parsed = LoginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false as const, message: "이메일/비밀번호를 확인해 주세요." };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) return { ok: false as const, message: "계정을 찾을 수 없어요." };

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { ok: false as const, message: "이메일/비밀번호가 틀렸어요." };

  const session = await getSession();
  session.userId = user.id;
  await session.save();

  redirect("/forms");
}

