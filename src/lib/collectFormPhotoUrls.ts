import type { FormType } from "@/generated/prisma/client";
import { photoRefToUrlList, type PhotoRef } from "@/lib/photoRef";

function pushRef(urls: string[], ref?: PhotoRef | null) {
  for (const u of photoRefToUrlList(ref ?? undefined)) {
    if (!urls.includes(u)) urls.push(u);
  }
}

/** 상세 화면 표시 순서대로 URL 수집 (preload용) */
export function collectFormPhotoUrls(
  type: FormType,
  data: unknown
): string[] {
  const urls: string[] = [];
  const root = data as Record<string, unknown>;

  if (type === "COMPLAINT") {
    const c = root.complaint as Record<string, unknown> | undefined;
    const receipt = c?.receipt as { photoAttachment?: PhotoRef } | undefined;
    const outsideAs = c?.outsideAs as { photoAttachment?: PhotoRef } | undefined;
    const prod = c?.productionHandlingReport as {
      causeAnalysisRefPhoto?: PhotoRef;
      recurrencePreventionRefPhoto?: PhotoRef;
    } | undefined;
    const lab = c?.researchLabHandlingReport as {
      causeAnalysisRefPhoto?: PhotoRef;
      recurrencePreventionRefPhoto?: PhotoRef;
    } | undefined;
    pushRef(urls, receipt?.photoAttachment);
    pushRef(urls, outsideAs?.photoAttachment);
    pushRef(urls, prod?.causeAnalysisRefPhoto);
    pushRef(urls, prod?.recurrencePreventionRefPhoto);
    pushRef(urls, lab?.causeAnalysisRefPhoto);
    pushRef(urls, lab?.recurrencePreventionRefPhoto);
    return urls;
  }

  if (type === "QUALITY_IMPROVEMENT") {
    const qi = root.qualityImprovement as {
      receipt?: { photoAttachment?: PhotoRef };
      review?: { photoAttachment?: PhotoRef };
    } | undefined;
    pushRef(urls, qi?.receipt?.photoAttachment);
    pushRef(urls, qi?.review?.photoAttachment);
    return urls;
  }

  if (type === "ABNORMAL_REPORT" || type === "WORK_COOP") {
    const key = type === "ABNORMAL_REPORT" ? "abnormalReport" : "workCoop";
    const b = root[key] as {
      report?: { photoAttachment?: PhotoRef };
      handlingReport?: { photoAttachment?: PhotoRef };
    } | undefined;
    pushRef(urls, b?.report?.photoAttachment);
    pushRef(urls, b?.handlingReport?.photoAttachment);
    return urls;
  }

  if (type === "SUGGESTION") {
    const sg = root.suggestion as {
      proposal?: { photoAttachment?: PhotoRef };
      reviewResult?: { photoAttachment?: PhotoRef };
    } | undefined;
    pushRef(urls, sg?.proposal?.photoAttachment);
    pushRef(urls, sg?.reviewResult?.photoAttachment);
    return urls;
  }

  return urls;
}

export function heroFormPhotoUrls(type: FormType, data: unknown, limit = 2) {
  return collectFormPhotoUrls(type, data).slice(0, limit);
}
