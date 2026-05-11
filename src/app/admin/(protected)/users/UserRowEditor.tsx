"use client";

import { useActionState } from "react";
import { updateUserAction } from "@/app/admin/(protected)/users/actions";

export type UserRowEditorVm = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
  createdLabel: string;
};

type State = { ok: false; message: string } | undefined;

export default function UserRowEditor({ user }: { user: UserRowEditorVm }) {
  const [state, action, pending] = useActionState<State, FormData>(
    updateUserAction,
    undefined
  );

  return (
    <>
      <tr className="border-b border-zinc-100">
        <td className="px-4 py-2.5 align-top text-sm text-zinc-900">{user.email}</td>
        <td className="px-4 py-2 align-top" colSpan={2}>
          <form action={action} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            <input type="hidden" name="userId" value={user.id} />
            <label className="block min-w-[7rem] flex-1">
              <span className="text-xs font-medium text-zinc-600">이름</span>
              <input
                name="name"
                type="text"
                required
                defaultValue={user.name}
                autoComplete="name"
                className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              />
            </label>
            <label className="block w-full min-w-[6rem] sm:w-32">
              <span className="text-xs font-medium text-zinc-600">권한</span>
              <select
                name="role"
                defaultValue={user.role}
                className="mt-0.5 w-full rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </label>
            <label className="block min-w-[10rem] flex-1 sm:max-w-xs">
              <span className="text-xs font-medium text-zinc-600">
                새 비밀번호 (선택)
              </span>
              <input
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="변경 시만 입력"
                className="mt-0.5 w-full rounded-lg border border-zinc-200 px-2 py-1.5 text-sm outline-none focus:border-zinc-400"
              />
            </label>
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
            >
              {pending ? "저장 중…" : "저장"}
            </button>
          </form>
        </td>
        <td className="hidden px-4 py-2.5 align-top text-xs text-zinc-500 sm:table-cell">
          {user.createdLabel}
        </td>
      </tr>
      {state?.ok === false ? (
        <tr className="border-b border-zinc-100 bg-red-50/90">
          <td
            colSpan={4}
            className="px-4 py-1.5 text-xs font-medium text-red-800"
          >
            {state.message}
          </td>
        </tr>
      ) : null}
    </>
  );
}
