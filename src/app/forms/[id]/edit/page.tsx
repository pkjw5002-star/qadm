import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NewFormClient from "@/app/forms/new/NewFormClient";
import { complaintJsonToFormDefaults } from "@/lib/complaintFormDefaults";
import { qualityImprovementJsonToDefaults } from "@/lib/qualityImprovementDefaults";
import { abnormalReportJsonToDefaults } from "@/lib/abnormalReportDefaults";
import { workCoopJsonToDefaults } from "@/lib/workCoopDefaults";
import { suggestionJsonToDefaults } from "@/lib/suggestionDefaults";
import { requireUser } from "@/lib/auth";

export default async function EditComplaintFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const form = await prisma.form.findUnique({ where: { id } });
  if (
    !form ||
    (form.type !== "COMPLAINT" &&
      form.type !== "QUALITY_IMPROVEMENT" &&
      form.type !== "ABNORMAL_REPORT" &&
      form.type !== "WORK_COOP" &&
      form.type !== "SUGGESTION")
  ) {
    notFound();
  }

  const options = await prisma.departmentOwnerOption.findMany({
    orderBy: { label: "asc" },
    select: { id: true, label: true },
  });

  const defaults =
    form.type === "COMPLAINT"
      ? complaintJsonToFormDefaults(form.data)
      : form.type === "QUALITY_IMPROVEMENT"
        ? qualityImprovementJsonToDefaults(form.data)
        : form.type === "ABNORMAL_REPORT"
          ? abnormalReportJsonToDefaults(form.data)
          : form.type === "WORK_COOP"
            ? workCoopJsonToDefaults(form.data)
            : suggestionJsonToDefaults(form.data);

  return (
    <NewFormClient
      departmentOwnerOptions={options}
      nextComplaintNo={form.title}
      editFormId={form.id}
      editType={form.type}
      defaults={defaults}
      currentUserName={user.name}
    />
  );
}
