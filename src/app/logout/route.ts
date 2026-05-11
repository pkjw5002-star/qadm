import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

async function destroySessionAndRedirectToLogin(request: Request) {
  const session = await getSession();
  session.destroy();
  return NextResponse.redirect(new URL("/login", request.url));
}

/** 폼 POST 로그아웃 */
export async function POST(request: Request) {
  return destroySessionAndRedirectToLogin(request);
}

/**
 * 브라우저 GET으로 세션 삭제 (Route Handler에서만 쿠키 수정 가능).
 * `requireUser` 등에서 DB에 없는 userId가 남았을 때 리다이렉트용.
 */
export async function GET(request: Request) {
  return destroySessionAndRedirectToLogin(request);
}

