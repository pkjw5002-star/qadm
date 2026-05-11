## QADM (사내 서식 관리) MVP

불만신고서/품질개선의뢰서/이상발생신고서/업무협조전/제안서를 **작성·조회·관리**하는 플랫폼의 MVP입니다.

- **Frontend/Backend**: Next.js (App Router)
- **DB**: SQLite (`prisma/dev.db`)
- **ORM**: Prisma
- **Auth**: iron-session (쿠키 기반 세션)

## Getting Started

### 1) 환경변수 설정

`.env`의 `SESSION_PASSWORD`를 **32자 이상 랜덤 문자열**로 바꾸세요.

### 2) DB 준비(최초 1회)

```bash
npx prisma migrate dev
npx prisma generate
```

### 3) 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:3000`을 열고,

- **최초 1회**: `/setup`에서 관리자 계정 생성
- 이후: `/login` 로그인 → `/forms`에서 작성/조회

## Current Features

- 서식 작성(공통필드: 제목/요약/상세) 및 제출
- 서식 목록(최근 50건)
- 서식 상세 + 이벤트 이력(최근 20건)

## Next Steps (추천)

- 서식 타입별 입력폼(필드 고정 + 유효성)
- 파일첨부/이미지/엑셀 내보내기
- 결재/승인 흐름(권한, 담당자 지정)
- 검색/필터/상태 변경/코멘트
