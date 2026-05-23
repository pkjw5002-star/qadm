import {
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { getFirebaseApp, isFirebaseConfigured } from "@/lib/firebase";

export type FormListLayoutPersisted = {
  widths?: Record<string, number>;
  hidden?: Record<string, boolean>;
};

function layoutDocId(storageKey: string): string {
  return storageKey.replace(/[/\\.#[\]]/g, "_");
}

function layoutDocRef(userId: string, storageKey: string) {
  const app = getFirebaseApp();
  if (!app) return null;
  const db = getFirestore(app);
  const id = layoutDocId(storageKey);
  return doc(db, "users", userId, "tableLayouts", id);
}

export async function loadFormListLayout(
  userId: string,
  storageKey: string
): Promise<FormListLayoutPersisted> {
  if (!isFirebaseConfigured() || !userId) return {};
  try {
    const ref = layoutDocRef(userId, storageKey);
    if (!ref) return {};
    const snap = await getDoc(ref);
    if (!snap.exists()) return {};
    const data = snap.data();
    return {
      widths: data.widths as Record<string, number> | undefined,
      hidden: data.hidden as Record<string, boolean> | undefined,
    };
  } catch {
    return {};
  }
}

export async function saveFormListLayout(
  userId: string,
  storageKey: string,
  payload: FormListLayoutPersisted
): Promise<void> {
  if (!isFirebaseConfigured() || !userId) return;
  try {
    const ref = layoutDocRef(userId, storageKey);
    if (!ref) return;
    const wKeys = payload.widths ? Object.keys(payload.widths).length : 0;
    const hKeys = payload.hidden ? Object.keys(payload.hidden).length : 0;
    if (wKeys === 0 && hKeys === 0) {
      await deleteDoc(ref);
      return;
    }
    await setDoc(
      ref,
      {
        widths: payload.widths ?? {},
        hidden: payload.hidden ?? {},
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch {
    /* ignore */
  }
}
