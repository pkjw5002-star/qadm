# Neon Postgres 설정 (5분)

Vercel에서 로그인·서식 데이터를 쓰려면 **클라우드 DB**가 필요합니다. Neon은 무료로 PostgreSQL을 제공합니다.

## 1. Neon 가입 및 DB 만들기

1. [https://neon.tech](https://neon.tech) 접속 → GitHub 등으로 가입
2. **New Project** → 이름 예: `qadm` → 리전 선택(가까운 곳) → Create
3. 대시보드 **Connection string** → **Prisma** 탭 선택
4. `postgresql://...` 로 시작하는 문자열 **복사**

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

## 4. Vercel 환경 변수

Vercel → 프로젝트 → **Settings** → **Environment Variables**

| 이름 | 값 |
|------|-----|
| `DATABASE_URL` | Neon에서 복사한 `postgresql://...` (로컬과 동일해도 됨) |
| `SESSION_PASSWORD` | `.env`와 동일 |
| `NEXT_PUBLIC_FIREBASE_*` | `.env.local` 6개 |

저장 후 **Redeploy**.

## 5. 관리자 계정

Neon DB는 **비어 있습니다.** 배포 사이트에서 `/setup` 으로 관리자를 다시 만드세요.

(예전 PC의 `dev.db` 데이터는 자동으로 옮겨지지 않습니다.)
