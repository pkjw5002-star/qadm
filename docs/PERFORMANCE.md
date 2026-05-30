# 배포 후 속도가 느릴 때

## 정상적으로 느려 보이는 경우

1. **첫 접속 (콜드 스타트)**  
   Vercel 무료 플랜은 잠시 쉬었다가 다시 접속하면 2~5초 걸릴 수 있습니다. **두 번째 클릭부터** 빨라지는지 확인하세요.

2. **지역 거리**  
   Neon DB가 `ap-southeast-1`(싱가포르)이면, Vercel 프로젝트 **Region**도 가까운 곳(예: Singapore / Hong Kong)이 유리합니다.  
   Vercel → Settings → General → **Region**

## 꼭 확인 (체감 속도 개선)

### Neon **Pooled** URL 사용 (권장)

Neon 대시보드 → Connect → **Connection pooling**  
호스트 예: `ep-xxxx-pooler.ap-southeast-1.aws.neon.tech`

- **Vercel `DATABASE_URL`** → Pooled
- **`DIRECT_URL`** → Direct (migrate용, 선택이지만 권장)

[docs/NEON_SETUP.md](NEON_SETUP.md) 참고.

### Vercel 환경 변수

`DATABASE_URL`이 **Production·Preview** 모두에 들어가 있는지, Redeploy 했는지 확인합니다.

## 코드 쪽 (적용됨)

- Neon URL이면 `@prisma/adapter-neon` 사용
- Prisma 클라이언트 global 캐시
- **서식 목록**: `listSnapshot`만 읽기 (`data` JSON은 snapshot 없을 때만 fallback)
- **`commentCount`**: 목록 댓글 수용 — `groupBy` 2번째 쿼리 제거
- Suspense 스트리밍 + 표 스켈레톤
- **상세**: 본문 먼저, 댓글 패널 별도 Suspense
- 상세 사진: preconnect + hero preload
- 목록 NO 링크 `prefetch`
- 표 **20행 초과** 시 가상 스크롤 (미만은 DOM 직접 렌더 — 빈 표 버그 방지)

### listSnapshot 백필 (배포 후 1회)

```bash
npm run backfill:list-snapshot
```

### commentCount 마이그레이션

`20260528120000_form_comment_count` — 기존 댓글 수 자동 backfill.

## 더 빨리 하고 싶을 때 (나중에)

- Vercel Pro (콜드 스타트 완화)
- [Prisma Accelerate](https://www.prisma.io/accelerate)
- 목록 페이지네이션 (50건 이상)
- 세션에 user name/role 캐시 → layout DB 조회 생략
