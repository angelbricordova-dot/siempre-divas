"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[14px] text-[#6e6458]">Usuario</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="block h-13 w-full rounded-xl bg-[#f4ecdd] px-4 text-[17px] text-[#1f1b16] outline-none placeholder:text-[#6e6458]/60 focus:ring-2 focus:ring-[#c9a45c]"
          placeholder="minerva"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[14px] text-[#6e6458]">Clave</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="block h-13 w-full rounded-xl bg-[#f4ecdd] px-4 text-[17px] text-[#1f1b16] outline-none focus:ring-2 focus:ring-[#c9a45c]"
        />
      </label>
      {state?.error && <p className="rounded-xl bg-[#f8dcd9] px-4 py-3 text-[15px] text-[#b3261e]">{state.error}</p>}
      <button
        disabled={pending}
        className="press mt-2 h-14 w-full rounded-full bg-[#c9a45c] text-[17px] font-semibold text-[#1f1b16] disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
