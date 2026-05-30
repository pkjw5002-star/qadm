"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { formListHref } from "@/lib/formTypes";
import { Prisma } from "@/generated/prisma/client";

type CommentAttachmentInput = {
  url: string;
  name?: string;
  mime?: string;
};

function parseCommentAttachmentsFromForm(
  formData: FormData
): CommentAttachmentInput[] {
  const urls = formData.getAll("commentAttachmentUrl");
  const names = formData.getAll("commentAttachmentName");
  const mimes = formData.getAll("commentAttachmentMime");

  const legacyUrls = formData.getAll("commentPhotoUrl");

  const rows: CommentAttachmentInput[] = [];
  const allUrls = [...urls, ...legacyUrls];

  for (let i = 0; i < allUrls.length; i++) {
    const rawUrl = String(allUrls[i] ?? "").trim();
    if (!rawUrl) continue;
    try {
      const u = new URL(rawUrl);
      if (u.protocol !== "http:" && u.protocol !== "https:") continue;
      const url = u.toString();
      if (rows.some((r) => r.url === url)) continue;
      const name = String(names[i] ?? "").trim() || undefined;
      const mime = String(mimes[i] ?? "").trim() || undefined;
      rows.push({ url, name, mime });
    } catch {
      continue;
    }
  }
  return rows.slice(0, 10);
}

export async function addFormCommentAction(formData: FormData) {
  const user = await requireUser();

  const formId = String(formData.get("formId") ?? "").trim();
  const raw = String(formData.get("comment") ?? "");
  const text = raw.trim();
  const attachments = parseCommentAttachmentsFromForm(formData);

  if (!formId) return;
  if (!text && attachments.length === 0) {
    redirect(`/forms/${formId}`);
  }

  await prisma.formEvent.create({
    data: {
      formId,
      actorId: user.id,
      action: "COMMENT",
      payload: {
        text,
        ...(attachments.length > 0 ? { attachments } : {}),
      } as Prisma.InputJsonValue,
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
  redirect(formListHref(existing.type));
}

