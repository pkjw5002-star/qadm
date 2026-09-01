"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";

const SetupSchema = z.object({
  name: z.string().trim().min(1).max(80),
  password: z.string().min(8),
});

export async function setupAdminAction(_: unknown, formData: FormData) {
  const exists = (await prisma.user.count()) > 0;
  if (exists) return { ok: false as const, message: "이미 초기 설정이 완료됐어요." };

  const parsed = SetupSchema.safeParse({
    name: String(formData.get("name") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) {
    return { ok: false as const, message: "입력값을 확인해 주세요. (비밀번호 8자 이상)" };
  }

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      role: "ADMIN",
    },
  });

  redirect("/admin/login");
}
