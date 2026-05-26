/**
 * .env / .env.local 값을 Vercel REST API로 등록합니다.
 *
 * 사용:
 *   1. https://vercel.com/account/tokens 에서 토큰 생성
 *   2. PowerShell:
 *        $env:VERCEL_TOKEN="..."
 *        node scripts/sync-vercel-env.mjs
 *
 * 프로젝트가 안 맞으면:
 *        $env:VERCEL_PROJECT="qadm"
 *        $env:VERCEL_TEAM_ID=""   # 팀 없으면 비움
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnvFile(name) {
  const path = resolve(ROOT, name);
  if (!existsSync(path)) return {};
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const KEYS = [
  "DATABASE_URL",
  "SESSION_PASSWORD",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_STORAGE_BUCKET",
];

const token = process.env.VERCEL_TOKEN?.trim();
if (!token) {
  console.error(`
[sync-vercel-env] VERCEL_TOKEN 이 없습니다.

1) https://vercel.com/account/tokens → Create Token
2) PowerShell:
     $env:VERCEL_TOKEN="토큰"
     node scripts/sync-vercel-env.mjs

또는 Vercel 대시보드에서 수동 등록: docs/VERCEL_ENV.md
`);
  process.exit(1);
}

const projectName = process.env.VERCEL_PROJECT?.trim() || "qadm";
const teamId = process.env.VERCEL_TEAM_ID?.trim();

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local") };
const missing = KEYS.filter((k) => !env[k]?.trim());
if (missing.length) {
  console.warn("[sync-vercel-env] 비어 있음 (건너뜀):", missing.join(", "));
}

async function api(path, init = {}) {
  const base = "https://api.vercel.com";
  const teamQ = teamId ? `?teamId=${teamId}` : "";
  const res = await fetch(`${base}${path}${teamQ}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${JSON.stringify(body)}`);
  }
  return body;
}

function isSensitiveTargetError(err) {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    msg.includes("Sensitive Environment Variable") &&
    msg.includes("target to development")
  );
}

const projects = await api("/v9/projects");
const project = projects.projects?.find(
  (p) => p.name === projectName || p.id === projectName
);
if (!project) {
  console.error(
    `[sync-vercel-env] 프로젝트 "${projectName}" 없음. VERCEL_PROJECT 이름 확인.`
  );
  process.exit(1);
}

const projectId = project.id;
console.log(`[sync-vercel-env] ${project.name} (${projectId})`);

const existing = await api(`/v9/projects/${projectId}/env`);
const byKey = new Map(
  (existing.envs ?? []).map((e) => [e.key, e])
);

for (const key of KEYS) {
  const value = env[key]?.trim();
  if (!value) continue;

  const targetsAll = ["production", "preview", "development"];
  const targetsNoDev = ["production", "preview"];
  const prev = byKey.get(key);

  if (prev) {
    try {
      await api(`/v9/projects/${projectId}/env/${prev.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          value,
          target: targetsAll,
        }),
      });
    } catch (e) {
      if (!isSensitiveTargetError(e)) throw e;
      await api(`/v9/projects/${projectId}/env/${prev.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          value,
          target: targetsNoDev,
        }),
      });
    }
    console.log(`  ✓ 업데이트 ${key}`);
  } else {
    try {
      await api(`/v9/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify({
          key,
          value,
          type: "encrypted",
          target: targetsAll,
        }),
      });
    } catch (e) {
      if (!isSensitiveTargetError(e)) throw e;
      await api(`/v9/projects/${projectId}/env`, {
        method: "POST",
        body: JSON.stringify({
          key,
          value,
          type: "encrypted",
          target: targetsNoDev,
        }),
      });
    }
    console.log(`  + 추가 ${key}`);
  }
}

console.log(`
[sync-vercel-env] 완료. Vercel → Deployments → Redeploy 하세요.
Storage 규칙: Firebase 콘솔 또는 firebase deploy --only storage (docs/PHOTO_UPLOAD.md)
`);
