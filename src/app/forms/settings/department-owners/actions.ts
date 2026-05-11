"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

const LabelSchema = z.object({
  label: z.string().min(1).max(100),
});

const IdSchema = z.object({
  id: z.string().min(1),
});

export async function addDepartmentOwnerOptionAction(formData: FormData) {
  await requireUser();

  const parsed = LabelSchema.safeParse({
    label: String(formData.get("label") ?? "").trim(),
  });
  if (!parsed.success) {
    redirect("/forms/settings/department-owners?error=empty");
  }

  await prisma.departmentOwnerOption.upsert({
    where: { label: parsed.data.label },
    create: { label: parsed.data.label },
    update: {},
  });

  redirect("/forms/settings/department-owners");
}

export async function deleteDepartmentOwnerOptionAction(formData: FormData) {
  await requireUser();

  const parsed = IdSchema.safeParse({
    id: String(formData.get("id") ?? ""),
  });
  if (!parsed.success) {
    redirect("/forms/settings/department-owners?error=id");
  }

  await prisma.departmentOwnerOption.delete({
    where: { id: parsed.data.id },
  });

  redirect("/forms/settings/department-owners");
}
