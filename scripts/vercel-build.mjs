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

console.log("[Vercel Build] prisma migrate deploy …");
execSync("npx prisma migrate deploy", { stdio: "inherit" });

console.log("[Vercel Build] next build …");
execSync("npx next build", { stdio: "inherit" });
