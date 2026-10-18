"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/client-ui";
import { inputClass } from "@/components/ui";
import { closeDay } from "./actions";

export function CloseForm({ date, defaultCounted }: { date: string; defaultCounted?: string }) {
  const [state, action] = useActionState(closeDay, null);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="date" value={date} />
      <label className="block">
        <span className="mb-1.5 block text-[14px] text-muted">¿Cuánto efectivo hay en la caja?</span>
        <input name="counted" inputMode="decimal" required defaultValue={defaultCounted} placeholder="0" className={`${inputClass} tabular h-14 text-[22px] font-semibold`} />
      </label>
      <input name="note" placeholder="Nota (opcional)" className={inputClass} />
      <FormMessage state={state} />
      <SubmitButton>Cerrar caja</SubmitButton>
    </form>
  );
}
