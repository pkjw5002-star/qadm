import type { CommentAttachmentMeta } from "@/lib/commentAttachmentTypes";

export type CommentPayload = {
  text?: string;
  attachments?: (string | CommentAttachmentMeta)[];
};

export type ParsedCommentPayload = {
  text: string;
  attachments: CommentAttachmentMeta[];
};

function normalizeAttachment(
  item: string | CommentAttachmentMeta
): CommentAttachmentMeta | null {
  if (typeof item === "string") {
    const url = item.trim();
    return url ? { url } : null;
  }
  if (item && typeof item === "object" && typeof item.url === "string") {
    const url = item.url.trim();
    if (!url) return null;
    return {
      url,
      name: item.name != null ? String(item.name).trim() || undefined : undefined,
      mime: item.mime != null ? String(item.mime).trim() || undefined : undefined,
    };
  }
  return null;
}

export function parseCommentPayload(payload: unknown): ParsedCommentPayload {
  const p = payload as CommentPayload | null;
  const text = p?.text != null ? String(p.text).trim() : "";
  const raw = p?.attachments;
  const attachments: CommentAttachmentMeta[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const norm = normalizeAttachment(item as string | CommentAttachmentMeta);
      if (norm && !attachments.some((a) => a.url === norm.url)) {
        attachments.push(norm);
      }
    }
  }
  return { text: text ?? "", attachments };
}

export function commentPayloadText(payload: unknown): string {
  return parseCommentPayload(payload).text;
}

export function commentHasContent(payload: unknown): boolean {
  const { text, attachments } = parseCommentPayload(payload);
  return Boolean(text) || attachments.length > 0;
}
