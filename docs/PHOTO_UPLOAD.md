# 사진·파일 업로드 설정

서식 사진(JPG/PNG)과 댓글 첨부(PDF·Office 등)는 DB(JSON)에 **URL**로 저장됩니다.

| 경로 | 용도 | 허용 형식 |
|------|------|-----------|
| `forms/` | 서식 사진 | JPG, PNG |
| `comments/` | 댓글 첨부 | JPG, PNG, PDF, Word, Excel |

| 환경 | 동작 |
|------|------|
| `NEXT_PUBLIC_FIREBASE_*` 설정됨 (로컬·Vercel) | 브라우저가 **Firebase Storage**에 업로드 → URL만 서버로 전송 |
| Firebase 미설정 + 로컬 | `public/uploads/complaints/` (서버 디스크) |
| Firebase 미설정 + Vercel | 저장 불가 → [VERCEL_ENV.md](./VERCEL_ENV.md) 참고 |

Vercel은 디스크에 파일을 남길 수 없습니다. **클라이언트 Storage 업로드**가 기본이며, Admin 서비스 계정은 선택 사항입니다.

## 1. Firebase Storage 켜기

1. [Firebase 콘솔](https://console.firebase.google.com) → 프로젝트 `qadm-29e97`
2. **Build** → **Storage** → **Get started** (아직 없으면)
3. 리전은 Neon DB와 가까운 곳 권장

## 2. Storage 규칙 배포 (필수)

저장소 **Rules** 탭에 프로젝트 루트 `storage.rules` 내용을 붙여넣고 **게시**하거나:

```bash
firebase deploy --only storage
```

규칙이 없으면 Vercel에서 `storage/unauthorized` 오류가 납니다.  
댓글에 PDF를 올리려면 `comments/` 규칙이 포함된 최신 `storage.rules`를 반드시 게시하세요.

## 3. Vercel 환경 변수

`.env.local`의 `NEXT_PUBLIC_FIREBASE_*` 6개를 Vercel에 등록합니다.  
자동: `npm run vercel:sync-env` (토큰 필요). 수동: [VERCEL_ENV.md](./VERCEL_ENV.md).

## 4. (선택) 서비스 계정 키 — 서버에서만 파일 업로드할 때

1. 프로젝트 설정(톱니바퀴) → **서비스 계정**
2. **새 비공개 키 생성** → JSON 다운로드
3. JSON에서 아래 값을 환경 변수로 등록:

| 변수 | JSON 필드 |
|------|-----------|
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key` (한 줄로, `\n` 유지) |
| `FIREBASE_STORAGE_BUCKET` | `storage_bucket` (선택, 없으면 `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` 사용) |

### 로컬 `.env` 예시

```env
FIREBASE_PROJECT_ID=qadm-29e97
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@qadm-29e97.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

### Vercel

위 3개(또는 4개)를 **Production / Preview** Environment Variables에 넣고 **Redeploy**.

`FIREBASE_PRIVATE_KEY`는 Vercel에 붙여넣을 때 따옴표 없이 넣어도 되고, 줄바꿈이 `\n` 두 글자로 들어가도 됩니다.

## 3. 확인

1. 서식 작성/수정에서 JPG·PNG 선택 후 저장
2. 상세 페이지에서 사진이 보이면 성공
3. 저장 후 URL이 `https://firebasestorage.googleapis.com/...` 형태인지 DB/화면에서 확인

## 문제 해결

- **수정·저장 시 `Failed to fetch`** → 서버 로그에 `Body exceeded 1 MB limit`이면 `next.config.js`의 `experimental.serverActions.bodySizeLimit`(현재 50MB) 적용 후 **dev 서버 재시작**
- **「Firebase Storage 서비스 계정이 필요합니다」** → Vercel에 Admin 환경 변수 미설정
- **사진 저장은 됐는데 안 보임** → Storage 규칙/토큰 URL 확인, 브라우저에서 URL 직접 열기
- **로컬만 안 됨** → `public/uploads/complaints` 폴더 쓰기 권한, 또는 Admin 키를 `.env`에 추가해 Storage 사용
