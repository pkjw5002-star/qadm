export default function NewFormLoading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-200" />
      <div className="mt-6 space-y-4">
        <div className="h-12 animate-pulse rounded-xl bg-zinc-100" />
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-12 animate-pulse rounded-xl bg-zinc-100" />
      </div>
    </div>
  );
}
