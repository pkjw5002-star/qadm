# Vercel 환경 변수 등록

로컬은 `public/uploads/`에 저장되고, **Vercel은 브라우저 → Firebase Storage** 업로드를 씁니다.  
아래 **NEXT_PUBLIC_FIREBASE_*** 6개가 Vercel에 없으면 배포에서 사진이 저장되지 않습니다.

## 방법 A — 스크립트 (권장)

1. [Vercel 토큰](https://vercel.com/account/tokens) 생성
2. PowerShell (프로젝트 폴더):

```powershell
$env:VERCEL_TOKEN="여기에_토큰"
npm run vercel:sync-env
```

3. Vercel 대시보드 → **Deployments** → 최신 배포 **Redeploy**

## 방법 B — 대시보드 수동

**Project → Settings → Environment Variables**  
Production · Preview · Development 모두에 추가:

| 변수 | 값 출처 |
|------|---------|
| `DATABASE_URL` | `.env` (Neon `postgresql://...`) |
| `SESSION_PASSWORD` | `.env` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `.env.local` |

`FIREBASE_*` Admin 3개는 **선택**(서버에서만 파일 업로드할 때).  
지금 앱은 **클라이언트 Storage 업로드**를 쓰므로 위 6개만 있어도 Vercel 사진 저장이 됩니다.

## Storage 규칙 (필수)

Firebase 콘솔 → **Storage** → **Rules** 탭 → `storage.rules` 내용 붙여넣기 → **게시**  
아시아 버킷 사용 시: [STORAGE_ASIA_MIGRATION.md](./STORAGE_ASIA_MIGRATION.md) 3단계 참고

또는 Firebase CLI:

```bash
npm i -g firebase-tools
firebase login
firebase use qadm-29e97
firebase deploy --only storage
```

## 확인

1. Redeploy 후 `qadm.vercel.app`에서 서식에 사진 첨부 → 저장
2. 상세 화면에 이미지 표시
3. URL이 `https://firebasestorage.googleapis.com/...` 형태
