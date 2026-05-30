# Neon Postgres 설정 (5분)

Vercel에서 로그인·서식 데이터를 쓰려면 **클라우드 DB**가 필요합니다. Neon은 무료로 PostgreSQL을 제공합니다.

## 1. Neon 가입 및 DB 만들기

1. [https://neon.tech](https://neon.tech) 접속 → GitHub 등으로 가입
2. **New Project** → 이름 예: `qadm` → 리전 선택(가까운 곳) → Create
3. 대시보드 **Connection string** → **Prisma** 탭 선택
4. `postgresql://...` 로 시작하는 문자열 **복사**  
   - **앱 런타임(Vercel Functions)** 용: **Pooled connection** (호스트에 `-pooler`) 권장  
   - **마이그레이션·로컬 `migrate deploy`**: **Direct connection** (호스트에 `-pooler` 없음)  
   - 한 URL만 쓸 거면 **Direct** 를 `DATABASE_URL`에 넣어도 됩니다 (빌드·앱 모두 동작).

## 2. 로컬 `.env` 수정

`.env` 파일에서 `DATABASE_URL` 한 줄을 Neon URL로 **교체**합니다.

```env
DATABASE_URL=postgresql://....?sslmode=require
SESSION_PASSWORD=...(기존 값 유지)
```

> 예전 `file:./dev.db`(SQLite)는 더 이상 사용하지 않습니다.

## 3. 테이블 생성 (최초 1회)

프로젝트 폴더에서:

```bash
npx prisma migrate deploy
npx prisma generate
```

**`P1013` / `file:./dev.db` 오류가 나면:** `.env`는 Neon URL인데 터미널에 예전 `DATABASE_URL=file:./dev.db`가 남은 경우입니다. PowerShell에서 `Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue` 후 다시 실행하거나, 터미널을 새로 열고 `npx prisma migrate deploy`를 실행하세요. (프로젝트는 `prisma.config.ts`에서 `.env`가 우선되도록 설정되어 있습니다.)

## 4. Vercel 환경 변수 (빌드 실패 방지)

Vercel → 프로젝트 → **Settings** → **Environment Variables**

**Production** 과 **Preview** 둘 다 체크해서 추가하세요.

| 이름 | 값 |
|------|-----|
| `DATABASE_URL` | Neon **Direct** 또는 Pooled `postgresql://...` (로컬 `.env`와 **완전히 동일**) |
| `DIRECT_URL` | (선택) Pooled를 `DATABASE_URL`에 쓸 때만 — Direct connection 문자열 |
| `SESSION_PASSWORD` | `.env`와 동일 (32자 이상) |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `.env.local` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `.env.local` |

저장 후 **Deployments → Redeploy**.

`Build Failed` / `prisma migrate deploy` 오류는 대부분 아래 중 하나입니다.

| 증상 | 조치 |
|------|------|
| `DATABASE_URL is not set` | Vercel Environment Variables에 등록 (Production + Preview) |
| `P1000` / authentication | Neon 비밀번호 재설정 후 `.env`·Vercel 동시 갱신 |
| pooler / advisory lock | `DATABASE_URL`을 Direct로 바꾸거나 `DIRECT_URL` 추가 |
| 로컬과 Vercel 값 불일치 | `npm run vercel:sync-env` (토큰 필요) 또는 수동 복사 |

로컬에서 `npm run vercel-build` 가 성공하면 Neon·마이그레이션은 정상입니다. **Vercel의 `DATABASE_URL`만 로컬 `.env`와 맞추면** 배포가 통과하는 경우가 많습니다.

## 5. 관리자 계정

Neon DB는 **비어 있습니다.** 배포 사이트에서 `/setup` 으로 관리자를 다시 만드세요.

(예전 PC의 `dev.db` 데이터는 자동으로 옮겨지지 않습니다.)
