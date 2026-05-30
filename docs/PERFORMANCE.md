# 배포 후 속도가 느릴 때

## 정상적으로 느려 보이는 경우

1. **첫 접속 (콜드 스타트)**  
   Vercel 무료 플랜은 잠시 쉬었다가 다시 접속하면 2~5초 걸릴 수 있습니다. **두 번째 클릭부터** 빨라지는지 확인하세요.

2. **지역 거리**  
   Neon DB가 `ap-southeast-1`(싱가포르)이면, Vercel 프로젝트 **Region**도 가까운 곳(예: Singapore / Hong Kong)이 유리합니다.  
   Vercel → Settings → General → **Region**

3. **목록 페이지**  
   서식 목록은 DB에서 JSON까지 읽어 옵니다. 데이터가 많아지면 점점 느려질 수 있습니다.

## 꼭 확인 (체감 속도 개선)

### Neon **Pooled** URL 사용 (권장)

Neon 대시보드 → Connect → **Connection pooling** / **Pooled**  
호스트 예: `ep-xxxx-pooler.ap-southeast-1.aws.neon.tech`

이 URL을 `.env`와 Vercel `DATABASE_URL`에 넣으세요.  
(일반 Direct URL보다 Vercel 서버리스에 맞습니다.)

### Vercel 환경 변수

`DATABASE_URL`이 **Production·Preview** 모두에 들어가 있는지, Redeploy 했는지 확인합니다.

## 코드 쪽 (이미 적용)

- Neon URL이면 `@prisma/adapter-neon` 사용 (TCP `pg`보다 서버리스에 유리)
- Prisma 클라이언트는 인스턴스당 한 번만 생성 (global 캐시)
- **서식 목록**: `Form.listSnapshot` 슬림 JSON + Suspense 스트리밍 + 표 행 가상화
- 목록 저장/수정 시 `listSnapshot` 자동 갱신

### listSnapshot 백필 (배포 후 1회)

마이그레이션만 적용하고 예전 서식이 있으면:

```bash
npm run backfill:list-snapshot
```

이후 타입별 목록은 DB에서 큰 `data` JSON 대신 `listSnapshot`만 읽습니다.

## 더 빨리 하고 싶을 때 (나중에)

- Vercel Pro (콜드 스타트 완화)
- [Prisma Accelerate](https://www.prisma.io/accelerate) (연결 풀·캐시)
- 목록 API 페이지네이션·필드 축소
