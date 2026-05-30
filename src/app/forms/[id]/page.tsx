import { Suspense } from "react";
import { FormDetailBody } from "@/app/forms/[id]/FormDetailBody";
import FormDetailLoading from "@/app/forms/[id]/loading";

export default async function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={<FormDetailLoading />}>
      <FormDetailBody id={id} />
    </Suspense>
  );
}
