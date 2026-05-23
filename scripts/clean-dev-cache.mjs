import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(root, ".next");

if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Removed .next cache");
} else {
  console.log(".next not found (ok)");
}

// output 경로 변경 전 남은 SQLite 클라이언트(client/ 폴더 + client.ts 충돌) 제거
const staleClientDir = path.join(root, "src", "generated", "prisma", "client");
if (fs.existsSync(staleClientDir) && fs.statSync(staleClientDir).isDirectory()) {
  fs.rmSync(staleClientDir, { recursive: true, force: true });
  console.log("Removed stale src/generated/prisma/client/ directory");
}
