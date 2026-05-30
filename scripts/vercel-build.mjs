import { execSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", override: true });
loadEnv({ path: ".env.local", override: true });

const dbUrl = process.env.DATABASE_URL?.trim();

if (!dbUrl) {
  console.error(`
[Vercel Build] DATABASE_URL is not set.

Vercel Dashboard → Project → Settings → Environment Variables 에서
Production / Preview 에 아래를 추가한 뒤 Redeploy 하세요.

  DATABASE_URL = Neon Connection string (Prisma 탭, postgresql://...)
  SESSION_PASSWORD = 32자 이상 (.env 와 동일)
  NEXT_PUBLIC_FIREBASE_* = .env.local 6개 (사진 업로드 필수)

자세히: docs/NEON_SETUP.md , docs/VERCEL_ENV.md , docs/PHOTO_UPLOAD.md
`);
  process.exit(1);
}

if (dbUrl.startsWith("file:") || dbUrl.startsWith("sqlite:")) {
  console.error(
    "[Vercel Build] DATABASE_URL must be postgresql:// (Neon). SQLite file: URLs are not supported."
  );
  process.exit(1);
}

function run(step, command) {
  console.log(`[Vercel Build] ${step} …`);
  try {
    execSync(command, { stdio: "inherit" });
  } catch {
    console.error(`
[Vercel Build] FAILED at: ${step}
Command: ${command}

Vercel → Deployments → 실패한 배포 → Building 로그에서 위 단계 근처 빨간 줄을 확인하세요.
- prisma migrate deploy 실패 → DATABASE_URL(Neon) 연결·마이그레이션 상태 확인
- next build 실패 → TypeScript/번들 오류 (로컬에서 npm run vercel-build 재현)
`);
    process.exit(1);
  }
}

run("prisma generate", "npx prisma generate");
run("prisma migrate deploy", "npx prisma migrate deploy");
run("next build", "npx next build");
