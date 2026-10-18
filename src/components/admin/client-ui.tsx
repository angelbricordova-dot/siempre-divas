"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { buttonClass, cx } from "@/components/ui";

export function SubmitButton({
  children,
  pendingText = "Guardando…",
  variant = "primary",
  size = "lg",
  className,
  name,
  value,
  formAction,
}: {
  children: ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "danger" | "ok" | "ghost";
  size?: "md" | "lg" | "sm";
  className?: string;
  name?: string;
  value?: string;
  formAction?: (fd: FormData) => void;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      formAction={formAction}
      disabled={pending}
      className={buttonClass(variant, size, cx("w-full", className))}
    >
      {pending ? pendingText : children}
    </button>
  );
}

/** Hoja inferior estilo iOS usando <dialog>. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 mx-auto max-h-[92svh] w-full max-w-lg overflow-hidden rounded-t-3xl bg-bg p-0 text-ink backdrop:bg-black/50 backdrop:animate-fade open:animate-sheet sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-3xl"
    >
      <div className="flex max-h-[92svh] flex-col">
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <span className="mx-auto mb-2 block h-1.5 w-10 rounded-full bg-surface-3 sm:hidden" aria-hidden />
        </div>
        <div className="flex items-center justify-between px-5 pb-3">
          <h2 className="text-[20px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="press inline-flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-muted"
            aria-label="Cerrar"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-[max(env(safe-area-inset-bottom),20px)]">{children}</div>
      </div>
    </dialog>
  );
}

export function FormMessage({ state }: { state?: { error?: string; ok?: string } | null }) {
  if (!state?.error && !state?.ok) return null;
  return (
    <p
      role="status"
      className={cx(
        "animate-rise rounded-xl px-3.5 py-3 text-[15px]",
        state.error ? "bg-bad-soft text-bad" : "bg-ok-soft text-ok",
      )}
    >
      {state.error ?? state.ok}
    </p>
  );
}

export function ConfirmButton({
  children,
  message,
  className,
  formAction,
}: {
  children: ReactNode;
  message: string;
  className?: string;
  formAction?: (fd: FormData) => void;
}) {
  return (
    <button
      type="submit"
      formAction={formAction}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
