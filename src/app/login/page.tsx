"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/app/login/actions";

type LoginState =
  | { ok: true }
  | { ok: false; message: string }
  | undefined;

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  );

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">QADM 로그인</h1>
          <p className="mt-1 text-sm text-zinc-600">
            불만/개선/이상/협조/제안 서식 관리
          </p>
        </div>

        <form action={action} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">이메일</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              placeholder="name@company.com"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">비밀번호</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {pending ? "로그인 중..." : "로그인"}
          </button>

          {state?.ok === false ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          ) : null}
        </form>

        <div className="mt-6 space-y-2 text-sm text-zinc-600">
          <p>
            <Link
              className="font-medium text-zinc-900 underline"
              href="/admin/login"
            >
              관리자 로그인
            </Link>
            은 별도 화면에서 진행합니다.
          </p>
          <p>
            최초 1회 관리자 계정 생성이 필요하면{" "}
            <Link className="font-medium text-zinc-900 underline" href="/setup">
              설정 페이지
            </Link>
            로 이동하세요.
          </p>
        </div>
      </div>
    </div>
  );
}

