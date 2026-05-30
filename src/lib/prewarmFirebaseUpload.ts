/** 사진 필드 마운트 시 Storage·업로드 모듈을 미리 로드 */
export function prewarmFirebaseUpload(): void {
  if (typeof window === "undefined") return;
  void import("@/lib/firebaseStorageClient").then(({ getClientStorage }) =>
    getClientStorage()
  );
  void import("@/lib/uploadFormPhotoClient");
}
