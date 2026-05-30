import FormsTableSkeleton from "@/app/forms/FormsTableSkeleton";

export default function FormsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-40 animate-pulse rounded-lg bg-zinc-200" />
      <FormsTableSkeleton />
    </div>
  );
}
