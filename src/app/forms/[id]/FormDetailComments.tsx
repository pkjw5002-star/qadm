import { prisma } from "@/lib/prisma";
import { parseCommentPayload } from "@/lib/commentPayload";
import CommentsPanel from "@/app/forms/[id]/CommentsPanel";

export async function FormDetailComments({ formId }: { formId: string }) {
  const events = await prisma.formEvent.findMany({
    where: { formId, action: "COMMENT" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { actor: { select: { name: true } } },
  });

  const comments = events
    .slice()
    .reverse()
    .map((e) => {
      const { text, attachments } = parseCommentPayload(e.payload);
      return {
        id: e.id,
        text,
        attachments,
        actorName: e.actor.name,
        createdAt: new Date(e.createdAt).toLocaleString(),
      };
    })
    .filter((c) => c.text !== "" || c.attachments.length > 0);

  return <CommentsPanel formId={formId} comments={comments} />;
}

export function CommentsPanelSkeleton() {
  return (
    <aside className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm lg:sticky lg:top-6 lg:self-start">
      <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
        <div className="h-4 w-12 animate-pulse rounded bg-zinc-200" />
        <div className="mt-2 h-3 w-32 animate-pulse rounded bg-zinc-100" />
      </div>
      <div className="space-y-3 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-zinc-100" />
            <div className="h-10 animate-pulse rounded-lg bg-zinc-50" />
          </div>
        ))}
      </div>
    </aside>
  );
}
