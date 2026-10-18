import type { Metadata } from "next";
import { LoginForm } from "./form";

export const metadata: Metadata = { title: "Ingresar", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="flex min-h-svh flex-col bg-white px-6 pt-[max(env(safe-area-inset-top),48px)] pb-10 text-[#1f1b16]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-deep.svg" alt="Siempre Divas, salón de belleza" className="mx-auto mt-6 w-56" />
        <div className="mt-auto pt-12">
          <h1 className="font-[family-name:var(--font-display)] text-[34px] leading-tight">Hola de nuevo</h1>
          <p className="mt-1 text-[16px] text-[#6e6458]">Ingresa para ver la caja, la agenda y las cuentas.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
