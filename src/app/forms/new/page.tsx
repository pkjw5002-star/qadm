import { prisma } from "@/lib/prisma";
import NewFormClient from "@/app/forms/new/NewFormClient";
import {
  getNextAbnormalReportFormNo,
  getNextComplaintFormNo,
  getNextQualityImprovementFormNo,
  getNextSuggestionFormNo,
  getNextWorkCoopFormNo,
} from "@/lib/formNo";
import { requireUser } from "@/lib/auth";

export default async function NewFormPage() {
  const [
    user,
    options,
    nextComplaintNo,
    nextQualityNo,
    nextAbnormalNo,
    nextWorkCoopNo,
    nextSuggestionNo,
  ] = await Promise.all([
    requireUser(),
    prisma.departmentOwnerOption.findMany({
      orderBy: { label: "asc" },
      select: { id: true, label: true },
    }),
    getNextComplaintFormNo(),
    getNextQualityImprovementFormNo(),
    getNextAbnormalReportFormNo(),
    getNextWorkCoopFormNo(),
    getNextSuggestionFormNo(),
  ]);

  return (
    <NewFormClient
      departmentOwnerOptions={options}
      nextComplaintNo={nextComplaintNo}
      nextQualityImprovementNo={nextQualityNo}
      nextAbnormalReportNo={nextAbnormalNo}
      nextWorkCoopNo={nextWorkCoopNo}
      nextSuggestionNo={nextSuggestionNo}
      currentUserName={user.name}
    />
  );
}

