/** Storage rules가 public read일 때 getDownloadURL 왕복 없이 URL 조립 */
export function buildFirebasePublicUrl(objectPath: string): string | null {
  const bucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
  if (!bucket) return null;
  const encoded = encodeURIComponent(objectPath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encoded}?alt=media`;
}
