import { prisma } from "@/lib/prisma";
import NewFormClient from "@/app/forms/new/NewFormClient";
import { getPreviewFormNumbers } from "@/lib/formNo";
import { requireUser } from "@/lib/auth";

export default async function NewFormPage() {
  const [user, options, previewNos] = await Promise.all([
    requireUser(),
    prisma.departmentOwnerOption.findMany({
      orderBy: { label: "asc" },
      select: { id: true, label: true },
    }),
    getPreviewFormNumbers(),
  ]);

  return (
    <NewFormClient
      departmentOwnerOptions={options}
      nextComplaintNo={previewNos.complaint}
      nextQualityImprovementNo={previewNos.qualityImprovement}
      nextAbnormalReportNo={previewNos.abnormalReport}
      nextWorkCoopNo={previewNos.workCoop}
      nextSuggestionNo={previewNos.suggestion}
      currentUserName={user.name}
      canManageDepartmentOwners={user.role === "ADMIN"}
    />
  );
}

