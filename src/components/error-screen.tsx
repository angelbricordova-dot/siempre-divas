"use client";

import { useEffect } from "react";

/** Pantalla de error en español, con enlace al diagnóstico. */
export function ErrorScreen({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="flex min-h-svh flex-col items-start justify-center bg-white px-6 py-16 text-[#1f1b16]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo-horizontal-deep.svg" alt="Siempre Divas" className="mb-10 h-10 w-auto" />
      <h1 className="font-[family-name:var(--font-display)] text-[34px] leading-tight font-light">Algo no cargó bien</h1>
      <p className="mt-3 max-w-[38ch] text-[17px] text-[#6e6458]">
        Puede ser un problema de conexión o que falte configurar la base de datos. Intenta de nuevo en un momento.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={reset} className="h-12 rounded-full bg-[#c9a45c] px-6 text-[16px] font-medium">
          Intentar de nuevo
        </button>
        <a href="/api/health" className="flex h-12 items-center rounded-full bg-[#f4ecdd] px-6 text-[16px]">
          Ver diagnóstico
        </a>
      </div>
      {error.digest && <p className="mt-8 text-[13px] text-[#6e6458]">Código: {error.digest}</p>}
    </main>
  );
}
