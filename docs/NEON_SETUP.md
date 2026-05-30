# Neon PostgreSQL 연결

## URL 종류 (성능)

| 변수 | 용도 | 호스트 예 |
|------|------|-----------|
| `DATABASE_URL` | **앱 런타임 (Vercel)** — Pooled 권장 | `ep-xxx-pooler.ap-southeast-1.aws.neon.tech` |
| `DIRECT_URL` | **migrate deploy** — Direct | `ep-xxx.ap-southeast-1.aws.neon.tech` |

Neon 대시보드 → Connect:

1. **Connection pooling** → `DATABASE_URL` (Vercel·로컬 dev)
2. **Direct connection** → `DIRECT_URL` (마이그레이션)

Pooled만 있을 때 `scripts/vercel-build.mjs`가 migrate용으로 `-pooler`를 제거한 Direct URL을 자동 추론합니다.  
가능하면 `DIRECT_URL`을 명시하는 편이 안전합니다.

`.env` 예:

```env
DATABASE_URL=postgresql://...@ep-xxxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://...@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

Vercel에 동일하게 등록: `npm run vercel:sync-env` 또는 [docs/VERCEL_ENV.md](VERCEL_ENV.md)

---

## 초기 설정

1. [Neon](https://neon.tech)에서 프로젝트 생성 (리전: **ap-southeast-1** 권장)
2. Connection string 복사
3. `.env` / `.env.local`에 위 변수 설정
4. `npx prisma migrate deploy`

**`P1013` / `file:./dev.db`:** 터미널에 예전 `DATABASE_URL`이 남았을 수 있습니다. 새 터미널에서 실행하세요.

## Vercel

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | Neon **Pooled** `postgresql://...` |
| `DIRECT_URL` | (권장) Neon **Direct** — 빌드 시 migrate |
| `SESSION_PASSWORD` | 32자 이상 |

| 증상 | 조치 |
|------|------|
| `DATABASE_URL is not set` | Vercel Environment Variables 등록 |
| P1000 authentication failed | Neon 비밀번호·Vercel 값 재동기화 |
| pooler / advisory lock | `DIRECT_URL` 추가 |

Region: Vercel **Settings → General → Region** → Singapore 등 DB와 가까운 곳.

자세히: [docs/PERFORMANCE.md](PERFORMANCE.md)
