import { commentPayloadText, parseCommentPayload } from "@/lib/commentPayload";

type LatestComment = {
  payload: unknown;
  createdAt: Date;
  actor: { name: string };
};

function trimPreviewText(text: string, max = 280): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

export function getCommentPreview(
  latest: LatestComment | undefined,
  totalCount: number
): { line: string; tooltip: string } | null {
  if (totalCount === 0 || !latest) return null;
  const { attachments } = parseCommentPayload(latest.payload);
  const body = trimPreviewText(commentPayloadText(latest.payload));
  const actor = latest.actor.name;
  const when = new Date(latest.createdAt).toLocaleString();
  const suffix = totalCount > 1 ? ` · ${totalCount}건` : "";
  const attachNote =
    attachments.length > 0 ? ` [첨부 ${attachments.length}]` : "";
  const line = body
    ? `${actor}: ${body}${attachNote}${suffix}`
    : attachments.length > 0
      ? `${actor}: (첨부 ${attachments.length}개)${suffix}`
      : `${actor}${suffix}`;
  const tooltip = [
    totalCount > 1 ? `총 ${totalCount}건 (최신 기준)` : "최신 댓글",
    `${actor} · ${when}`,
    "",
    body ||
      (attachments.length > 0
        ? `(첨부 ${attachments.length}개)`
        : "(내용 없음)"),
  ].join("\n");
  return { line, tooltip };
}
