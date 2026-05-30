import { execSync } from "node:child_process";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", override: true });
loadEnv({ path: ".env.local", override: true });

function normalizeDbUrl(raw) {
  if (!raw) return "";
  let url = raw.trim();
  if (
    (url.startsWith('"') && url.endsWith('"')) ||
    (url.startsWith("'") && url.endsWith("'"))
  ) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

function dbHostLabel(url) {
  try {
    const host = new URL(url.replace(/^postgresql:/, "http:")).hostname;
    return host.includes("-pooler") ? `${host} (pooled)` : host;
  } catch {
    return "(invalid URL)";
  }
}

/** Neon migrate deploy needs a direct (non-pooler) connection. */
function migrateDatabaseUrl() {
  const direct = normalizeDbUrl(process.env.DIRECT_URL);
  if (direct) return direct;

  const url = normalizeDbUrl(process.env.DATABASE_URL);
  if (url.includes("-pooler.")) {
    return url.replace("-pooler.", ".");
  }
  return url;
}

const dbUrl = normalizeDbUrl(process.env.DATABASE_URL);

if (!dbUrl) {
  console.error(`
[Vercel Build] DATABASE_URL is not set.

Vercel Dashboard → Project → Settings → Environment Variables 에서
Production / Preview 에 아래를 추가한 뒤 Redeploy 하세요.

  DATABASE_URL = Neon Connection string (postgresql://..., .env 와 동일)
  SESSION_PASSWORD = 32자 이상 (.env 와 동일)
  NEXT_PUBLIC_FIREBASE_* = .env.local 6개 (사진 업로드 필수)

로컬 .env 와 동일하게 맞추려면:
  $env:VERCEL_TOKEN="..." ; npm run vercel:sync-env

자세히: docs/NEON_SETUP.md , docs/VERCEL_ENV.md
`);
  process.exit(1);
}

if (dbUrl.startsWith("file:") || dbUrl.startsWith("sqlite:")) {
  console.error(
    "[Vercel Build] DATABASE_URL must be postgresql:// (Neon). SQLite file: URLs are not supported."
  );
  process.exit(1);
}

function run(step, command, envPatch = {}) {
  console.log(`[Vercel Build] ${step} …`);
  try {
    execSync(command, {
      stdio: "inherit",
      env: { ...process.env, ...envPatch },
    });
  } catch {
    console.error(`
[Vercel Build] FAILED at: ${step}
Command: ${command}

Vercel → Deployments → 실패한 배포 → Building 로그에서 위 단계 **바로 위** 빨간 Prisma 줄을 확인하세요.

자주 나는 원인:
- DATABASE_URL 이 Vercel에 없거나 로컬 .env 와 다름 → npm run vercel:sync-env 또는 수동 등록
- Neon 비밀번호 변경 후 Vercel 값 미갱신 → P1000 / authentication failed
- pooler URL 로 migrate 실패 → DIRECT_URL 추가 또는 .env 의 Direct connection 사용
- P3009 failed migration → 로컬에서 npx prisma migrate resolve --applied <이름>

현재 Vercel DATABASE_URL host: ${dbHostLabel(dbUrl)}
`);
    process.exit(1);
  }
}

run("prisma generate", "npx prisma generate");

const migrateUrl = migrateDatabaseUrl();
console.log(
  `[Vercel Build] migrate DB host: ${dbHostLabel(migrateUrl)}`
);
run("prisma migrate deploy", "npx prisma migrate deploy", {
  DATABASE_URL: migrateUrl,
});

run("next build", "npx next build");
