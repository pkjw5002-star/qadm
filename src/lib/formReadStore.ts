import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase";

const LOCAL_PREFIX = "qadm-form-reads";

export const FORM_READ_CHANGED_EVENT = "qadm-form-reads-changed";

/** formId → 마지막으로 확인한 form.updatedAt (ISO) */
export type FormSeenMap = Record<string, string>;

function localKey(userId: string): string {
  return `${LOCAL_PREFIX}-${userId}`;
}

function readDocRef(userId: string) {
  const app = getFirebaseApp();
  if (!app) return null;
  const db = getFirestore(app);
  return doc(db, "users", userId, "prefs", "formReads");
}

function toIso(value: Date | string): string {
  if (value instanceof Date) return value.toISOString();
  const s = String(value).trim();
  if (!s) return new Date().toISOString();
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toISOString();
}

function parseSeenMap(raw: unknown): FormSeenMap {
  if (!raw || typeof raw !== "object") return {};

  // 구형식: string[]
  if (Array.isArray(raw)) {
    const now = new Date().toISOString();
    const out: FormSeenMap = {};
    for (const id of raw) {
      if (typeof id === "string" && id.trim() !== "") out[id] = now;
    }
    return out;
  }

  const o = raw as { seen?: unknown; ids?: unknown };
  if (o.seen && typeof o.seen === "object" && !Array.isArray(o.seen)) {
    const out: FormSeenMap = {};
    for (const [id, at] of Object.entries(o.seen as Record<string, unknown>)) {
      if (typeof id === "string" && id.trim() !== "" && typeof at === "string") {
        out[id] = at;
      }
    }
    return out;
  }

  if (Array.isArray(o.ids)) {
    const now = new Date().toISOString();
    const out: FormSeenMap = {};
    for (const id of o.ids) {
      if (typeof id === "string" && id.trim() !== "") out[id] = now;
    }
    return out;
  }

  return {};
}

function dispatchReadChanged(userId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(FORM_READ_CHANGED_EVENT, { detail: { userId } })
  );
}

function mergeSeenMaps(a: FormSeenMap, b: FormSeenMap): FormSeenMap {
  const out: FormSeenMap = { ...a };
  for (const [id, at] of Object.entries(b)) {
    const prev = out[id];
    if (!prev || at > prev) out[id] = at;
  }
  return out;
}

export function loadFormSeenLocal(userId: string): FormSeenMap {
  if (typeof window === "undefined" || !userId) return {};
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return {};
    return parseSeenMap(JSON.parse(raw));
  } catch {
    return {};
  }
}

/** @deprecated 호환용 — 확인 완료된 서류 id 집합 */
export function loadFormReadIdsLocal(userId: string): Set<string> {
  return new Set(Object.keys(loadFormSeenLocal(userId)));
}

function saveFormSeenLocal(userId: string, seen: FormSeenMap): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(
      localKey(userId),
      JSON.stringify({ seen, updatedAt: new Date().toISOString() })
    );
  } catch {
    /* ignore */
  }
}

async function syncFormSeenToFirebase(
  userId: string,
  seen: FormSeenMap
): Promise<void> {
  if (!isFirebaseConfigured()) return;
  try {
    const ref = readDocRef(userId);
    if (!ref) return;
    await setDoc(
      ref,
      {
        seen,
        ids: Object.keys(seen),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
}

export async function loadFormSeen(userId: string): Promise<FormSeenMap> {
  if (!userId) return {};

  const local = loadFormSeenLocal(userId);

  if (isFirebaseConfigured()) {
    try {
      const ref = readDocRef(userId);
      if (ref) {
        const snap = await getDoc(ref);
        const remote = snap.exists()
          ? parseSeenMap(snap.data())
          : ({} as FormSeenMap);
        const merged = mergeSeenMaps(local, remote);
        saveFormSeenLocal(userId, merged);
        if (Object.keys(merged).length > Object.keys(remote).length) {
          void syncFormSeenToFirebase(userId, merged);
        }
        return merged;
      }
    } catch {
      /* fallback local */
    }
  }

  return local;
}

/** @deprecated */
export async function loadFormReadIds(userId: string): Promise<Set<string>> {
  return new Set(Object.keys(await loadFormSeen(userId)));
}

export function isFormNeedsAttention(
  seen: FormSeenMap,
  formId: string,
  updatedAt: Date | string
): boolean {
  const seenAt = seen[formId];
  if (!seenAt) return true;
  return toIso(updatedAt) > seenAt;
}

export async function markFormRead(
  userId: string,
  formId: string,
  formUpdatedAt?: Date | string
): Promise<void> {
  if (!userId || !formId) return;

  const seen = loadFormSeenLocal(userId);
  const at = toIso(formUpdatedAt ?? new Date());
  const prev = seen[formId];
  if (prev && prev >= at) {
    dispatchReadChanged(userId);
    return;
  }

  seen[formId] = at;
  saveFormSeenLocal(userId, seen);
  dispatchReadChanged(userId);
  void syncFormSeenToFirebase(userId, seen);
}
