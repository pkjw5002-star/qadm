import type { FormTypeKey } from "@/lib/formTypes";
import { FORM_TYPE_LABEL } from "@/lib/formTypes";

type SkeletonProps = {
  type?: FormTypeKey;
};

export default function FormsTableSkeleton({ type }: SkeletonProps) {
  const isTyped = type !== undefined;
  const colCount = isTyped ? 8 : 6;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      {!isTyped ? (
        <div className="grid grid-cols-12 gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="col-span-2 h-3 animate-pulse rounded bg-zinc-200 last:col-span-1"
            />
          ))}
        </div>
      ) : (
        <div className="flex gap-2 border-b border-zinc-200 bg-zinc-50 px-2 py-2">
          {Array.from({ length: colCount }).map((_, i) => (
            <div
              key={i}
              className="h-3 flex-1 animate-pulse rounded bg-zinc-200"
              style={{ minWidth: i === 0 ? 48 : 72 }}
            />
          ))}
        </div>
      )}
      <div className="divide-y divide-zinc-100">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="flex gap-2 px-2 py-3">
            {Array.from({ length: colCount }).map((_, j) => (
              <div
                key={j}
                className="h-4 flex-1 animate-pulse rounded bg-zinc-100"
                style={{ minWidth: j === 0 ? 48 : 72 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FormsListShell({
  type,
  children,
}: {
  type?: FormTypeKey;
  children: React.ReactNode;
}) {
  const listPageTitle =
    type !== undefined ? FORM_TYPE_LABEL[type] : "서식 목록";

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="text-lg font-semibold tracking-tight">{listPageTitle}</h1>
      </div>
      {children}
    </div>
  );
}
