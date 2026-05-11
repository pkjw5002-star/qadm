"use client";

import Link from "next/link";
import { useActionState } from "react";
import { setupAdminAction } from "@/app/setup/actions";

type SetupState = { ok: false; message: string } | undefined;

export default function SetupPage() {
  const [state, action, pending] = useActionState<SetupState, FormData>(
    setupAdminAction,
    undefined
  );

  return (
    <div className="min-h-dvh flex items-center justify-center bg-zinc-50 p-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <h1 className="text-xl font-semibold tracking-tight">초기 관리자 설정</h1>
          <p className="mt-1 text-sm text-zinc-600">
            최초 1회만 생성됩니다. (이미 계정이 있으면 실패합니다)
          </p>
        </div>

        <form action={action} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">이름</span>
            <input
              name="name"
              required
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">이메일</span>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              placeholder="admin@company.com"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">비밀번호</span>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
              placeholder="8자 이상"
            />
          </label>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            {pending ? "생성 중..." : "관리자 계정 생성"}
          </button>

          {state?.ok === false ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.message}
            </div>
          ) : null}
        </form>

        <div className="mt-6 text-sm text-zinc-600">
          로그인으로 돌아가기{" "}
          <Link className="font-medium text-zinc-900 underline" href="/login">
            /login
          </Link>
        </div>
      </div>
    </div>
  );
}

