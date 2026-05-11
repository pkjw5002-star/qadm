"use client";

import { useActionState } from "react";
import { createUserAction } from "@/app/admin/(protected)/users/actions";

type State = { ok: false; message: string } | undefined;

export default function UsersRegisterForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    createUserAction,
    undefined
  );

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-zinc-900">사용자 등록</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">이메일</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="off"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
            placeholder="user@company.com"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">이름</span>
          <input
            name="name"
            type="text"
            required
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
            placeholder="홍길동"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">권한</span>
          <select
            name="role"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 outline-none focus:border-zinc-400"
            defaultValue="USER"
          >
            <option value="USER">일반</option>
            <option value="ADMIN">관리자</option>
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-zinc-800">
            초기 비밀번호 (8자 이상)
          </span>
          <input
            name="password"
            type="password"
            required
            autoComplete="new-password"
            minLength={8}
            className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2 outline-none focus:border-zinc-400"
            placeholder="••••••••"
          />
        </label>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {pending ? "등록 중..." : "사용자 등록"}
      </button>
      {state?.ok === false ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </div>
      ) : null}
    </form>
  );
}
