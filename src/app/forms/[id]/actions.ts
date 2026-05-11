"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { Prisma } from "@/generated/prisma/client";

export async function addFormCommentAction(formData: FormData) {
  const user = await requireUser();

  const formId = String(formData.get("formId") ?? "").trim();
  const raw = String(formData.get("comment") ?? "");
  const text = raw.trim();

  if (!formId) return;
  if (!text) {
    redirect(`/forms/${formId}`);
  }

  await prisma.formEvent.create({
    data: {
      formId,
      actorId: user.id,
      action: "COMMENT",
      payload: { text } as Prisma.InputJsonValue,
    },
  });

  revalidatePath(`/forms/${formId}`);
  redirect(`/forms/${formId}`);
}

export async function deleteFormAction(formData: FormData) {
  const user = await requireUser();

  const formId = String(formData.get("formId") ?? "").trim();
  if (!formId) {
    redirect("/forms");
  }

  if (user.role !== "ADMIN") {
    redirect(`/forms/${formId}`);
  }

  const existing = await prisma.form.findUnique({ where: { id: formId } });
  if (!existing) {
    redirect("/forms");
  }

  await prisma.form.delete({ where: { id: formId } });

  revalidatePath("/forms");
  revalidatePath(`/forms/${formId}`);
  redirect("/forms");
}

