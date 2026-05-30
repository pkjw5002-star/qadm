import { Suspense } from "react";
import { isFormTypeKey } from "@/lib/formTypes";
import FormsListContent from "@/app/forms/FormsListContent";
import FormsTableSkeleton, {
  FormsListShell,
} from "@/app/forms/FormsTableSkeleton";

export default async function FormsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const type = isFormTypeKey(sp.type) ? sp.type : undefined;

  return (
    <FormsListShell type={type}>
      <Suspense fallback={<FormsTableSkeleton type={type} />}>
        <FormsListContent type={type} />
      </Suspense>
    </FormsListShell>
  );
}
