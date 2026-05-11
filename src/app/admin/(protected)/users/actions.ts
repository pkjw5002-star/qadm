"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, requireAdmin } from "@/lib/auth";

const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  password: z.string().min(8).max(200),
  role: z.enum(["USER", "ADMIN"]),
});

export async function createUserAction(_: unknown, formData: FormData) {
  await requireAdmin();

  const parsed = CreateUserSchema.safeParse({
    email: String(formData.get("email") ?? "").trim().toLowerCase(),
    name: String(formData.get("name") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
    role:
      String(formData.get("role") ?? "USER") === "ADMIN" ? "ADMIN" : "USER",
  });
  if (!parsed.success) {
    return {
      ok: false as const,
      message:
        "입력값을 확인해 주세요. (이메일 형식, 이름, 비밀번호 8자 이상)",
    };
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (exists) {
    return { ok: false as const, message: "이미 같은 이메일이 등록되어 있어요." };
  }

  await prisma.user.create({
    data: {
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
    },
  });

  redirect("/admin/users?created=1");
}

const UpdateUserSchema = z
  .object({
    userId: z.string().min(1),
    name: z.string().min(1).max(80),
    role: z.enum(["USER", "ADMIN"]),
    newPassword: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const p = d.newPassword != null ? String(d.newPassword).trim() : "";
    if (p !== "" && p.length < 8) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "새 비밀번호는 8자 이상이어야 합니다.",
        path: ["newPassword"],
      });
    }
  });

export async function updateUserAction(_: unknown, formData: FormData) {
  const me = await requireAdmin();

  const parsed = UpdateUserSchema.safeParse({
    userId: String(formData.get("userId") ?? "").trim(),
    name: String(formData.get("name") ?? "").trim(),
    role:
      String(formData.get("role") ?? "USER") === "ADMIN" ? "ADMIN" : "USER",
    newPassword: String(formData.get("newPassword") ?? ""),
  });
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "입력값을 확인해 주세요.";
    return { ok: false as const, message: msg };
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, role: true },
  });
  if (!target) {
    return { ok: false as const, message: "사용자를 찾을 수 없습니다." };
  }

  if (me.id === parsed.data.userId && parsed.data.role === "USER") {
    const otherAdmins = await prisma.user.count({
      where: { role: "ADMIN", id: { not: me.id } },
    });
    if (otherAdmins === 0) {
      return {
        ok: false as const,
        message:
          "다른 관리자 계정이 없으면 본인의 관리자 권한을 해제할 수 없습니다.",
      };
    }
  }

  const pw = String(parsed.data.newPassword ?? "").trim();
  const data: {
    name: string;
    role: "USER" | "ADMIN";
    passwordHash?: string;
  } = {
    name: parsed.data.name,
    role: parsed.data.role,
  };
  if (pw !== "") {
    data.passwordHash = await hashPassword(pw);
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data,
  });

  redirect("/admin/users?updated=1");
}
