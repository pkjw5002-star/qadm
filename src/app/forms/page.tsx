import { Suspense } from "react";
import { isFormTypeKey } from "@/lib/formTypes";
import FormsListContent from "@/app/forms/FormsListContent";
import FormsTableSkeleton, {
  FormsListShell,
} from "@/app/forms/FormsTableSkeleton";

export default async function FormsPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string; view?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const type = isFormTypeKey(sp.type) ? sp.type : undefined;
  const view = !type && sp.view === "recent" ? "recent" : "all";

  return (
    <FormsListShell type={type}>
      <Suspense fallback={<FormsTableSkeleton type={type} />}>
        <FormsListContent type={type} view={view} />
      </Suspense>
    </FormsListShell>
  );
}
