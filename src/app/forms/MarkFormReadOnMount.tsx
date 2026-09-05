"use client";

import { useEffect } from "react";
import { markFormRead } from "@/lib/formReadStore";
import { useFormsUserId } from "@/app/forms/FormsUserContext";

export default function MarkFormReadOnMount({
  formId,
  formUpdatedAt,
}: {
  formId: string;
  formUpdatedAt: string;
}) {
  const userId = useFormsUserId();

  useEffect(() => {
    if (!userId) return;
    void markFormRead(userId, formId, formUpdatedAt);
  }, [userId, formId, formUpdatedAt]);

  return null;
}
