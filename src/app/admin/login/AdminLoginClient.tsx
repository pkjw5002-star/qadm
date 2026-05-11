"use client";

import { useActionState } from "react";
import { adminLoginAction } from "@/app/admin/login/actions";

type State = { ok: false; message: string } | undefined;

export default function AdminLoginClient() {
  const [state, action, pending] = useActionState<State, FormData>(
    adminLoginAction,
    undefined
  );

  return (
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
        className="w-full rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "로그인 중..." : "관리자로 로그인"}
      </button>

      {state?.ok === false ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
