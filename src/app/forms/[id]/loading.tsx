export default function FormDetailLoading() {
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200" />
        <div className="flex gap-2">
          <div className="h-9 w-14 animate-pulse rounded-xl bg-zinc-100" />
          <div className="h-9 w-14 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </div>
      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
        <div className="h-5 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="space-y-2">
          <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-zinc-100" />
        </div>
        <div className="min-h-48 animate-pulse rounded-xl border border-zinc-200 bg-zinc-100" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-zinc-100" />
      </div>
    </div>
  );
}
