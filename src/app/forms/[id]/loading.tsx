export default function FormDetailLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="h-6 w-32 animate-pulse rounded bg-zinc-200" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="h-96 animate-pulse rounded-2xl bg-zinc-100" />
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    </div>
  );
}
