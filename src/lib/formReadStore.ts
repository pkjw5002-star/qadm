import {
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase";

const LOCAL_PREFIX = "qadm-form-reads";

function localKey(userId: string): string {
  return `${LOCAL_PREFIX}-${userId}`;
}

function readDocRef(userId: string) {
  const app = getFirebaseApp();
  if (!app) return null;
  const db = getFirestore(app);
  return doc(db, "users", userId, "prefs", "formReads");
}

function parseIds(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((x) => typeof x === "string" && x.trim() !== ""));
}

export function loadFormReadIdsLocal(userId: string): Set<string> {
  if (typeof window === "undefined" || !userId) return new Set();
  try {
    const raw = localStorage.getItem(localKey(userId));
    if (!raw) return new Set();
    return parseIds(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveFormReadIdsLocal(userId: string, ids: Set<string>): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    localStorage.setItem(localKey(userId), JSON.stringify([...ids]));
  } catch {
    /* ignore */
  }
}

export async function loadFormReadIds(userId: string): Promise<Set<string>> {
  if (!userId) return new Set();

  if (isFirebaseConfigured()) {
    try {
      const ref = readDocRef(userId);
      if (ref) {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const ids = parseIds(snap.data().ids);
          saveFormReadIdsLocal(userId, ids);
          return ids;
        }
      }
    } catch {
      /* fallback local */
    }
  }

  return loadFormReadIdsLocal(userId);
}

export async function markFormRead(userId: string, formId: string): Promise<void> {
  if (!userId || !formId) return;

  const ids = loadFormReadIdsLocal(userId);
  if (ids.has(formId)) return;
  ids.add(formId);
  saveFormReadIdsLocal(userId, ids);

  if (!isFirebaseConfigured()) return;
  try {
    const ref = readDocRef(userId);
    if (!ref) return;
    await setDoc(
      ref,
      { ids: [...ids], updatedAt: new Date().toISOString() },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
}
