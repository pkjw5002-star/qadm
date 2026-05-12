/** 제안서 수정 폼의 `defaultValue`용 플랫 필드 */
export type SuggestionDefaults = Partial<{
  sgProposalDate: string;
  sgWriterName: string;
  sgProposalContent: string;
  sgProposalEffect: string;
  sgProposalPhotoUrlDirect: string;

  sgReviewDate: string;
  sgReviewerComment: string;
  sgProcessingHandler: string;
  sgProcessingPlannedDate: string;
  sgProcessingContent: string;
  sgProcessingPhotoUrlDirect: string;
}>;

function dateInput(v: unknown): string {
  if (v === undefined || v === null) return "";
  const s = String(v).trim();
  if (s === "") return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${day}`;
}

/** DB `Form.data` JSON에서 수정 폼 기본값 추출 */
export function suggestionJsonToDefaults(data: unknown): SuggestionDefaults {
  const root = data as {
    suggestion?: {
      proposal?: Record<string, unknown>;
      reviewResult?: Record<string, unknown>;
    };
  };
  const proposal = root.suggestion?.proposal;
  const review = root.suggestion?.reviewResult;

  const proposalPhoto = proposal?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;
  const processingPhoto = review?.photoAttachment as
    | { uploadedUrl?: string; externalUrl?: string }
    | undefined;

  return {
    sgProposalDate: dateInput(proposal?.date),
    sgWriterName: proposal?.writerName != null ? String(proposal.writerName) : "",
    sgProposalContent:
      proposal?.content != null ? String(proposal.content) : "",
    sgProposalEffect:
      proposal?.effect != null ? String(proposal.effect) : "",
    sgProposalPhotoUrlDirect: proposalPhoto?.externalUrl ?? "",

    sgReviewDate: dateInput(review?.reviewDate),
    sgReviewerComment:
      review?.reviewerCommentLine != null
        ? String(review.reviewerCommentLine)
        : "",
    sgProcessingHandler:
      review?.processingHandler != null
        ? String(review.processingHandler)
        : "",
    sgProcessingPlannedDate: dateInput(review?.processingPlannedDate),
    sgProcessingContent:
      review?.processingContent != null
        ? String(review.processingContent)
        : "",
    sgProcessingPhotoUrlDirect: processingPhoto?.externalUrl ?? "",
  };
}
