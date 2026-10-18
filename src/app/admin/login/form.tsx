"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="mt-6 space-y-3">
      <label className="block">
        <span className="mb-1.5 block text-[14px] text-brand-ivory/70">Usuario</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="block h-13 w-full rounded-xl bg-white/10 px-4 text-[17px] text-brand-ivory outline-none placeholder:text-brand-ivory/40 focus:ring-2 focus:ring-brand-gold"
          placeholder="minerva"
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-[14px] text-brand-ivory/70">Clave</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="block h-13 w-full rounded-xl bg-white/10 px-4 text-[17px] text-brand-ivory outline-none focus:ring-2 focus:ring-brand-gold"
        />
      </label>
      {state?.error && <p className="rounded-xl bg-red-500/15 px-4 py-3 text-[15px] text-red-200">{state.error}</p>}
      <button
        disabled={pending}
        className="press mt-2 h-14 w-full rounded-xl bg-brand-gold text-[17px] font-semibold text-brand-black disabled:opacity-60"
      >
        {pending ? "Ingresando…" : "Ingresar"}
      </button>
    </form>
  );
}
