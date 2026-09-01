"use client";

import { useEffect } from "react";
import { markFormRead } from "@/lib/formReadStore";
import { useFormsUserId } from "@/app/forms/FormsUserContext";

export default function MarkFormReadOnMount({ formId }: { formId: string }) {
  const userId = useFormsUserId();

  useEffect(() => {
    if (!userId) return;
    void markFormRead(userId, formId);
  }, [userId, formId]);

  return null;
}
