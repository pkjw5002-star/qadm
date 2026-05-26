import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getFirebaseApp } from "@/lib/firebase";

let cached: FirebaseStorage | null | undefined;

/** 클라이언트 Storage 인스턴스 재사용 (매 업로드마다 초기화 방지) */
export function getClientStorage(): FirebaseStorage | null {
  if (cached !== undefined) return cached;
  const app = getFirebaseApp();
  cached = app ? getStorage(app) : null;
  return cached;
}
