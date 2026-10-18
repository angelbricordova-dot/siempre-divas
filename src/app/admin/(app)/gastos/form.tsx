"use client";

import { useActionState, useRef, useEffect } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/client-ui";
import { inputClass } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/labels";
import { addExpense } from "./actions";

export function ExpenseForm({ today }: { today: string }) {
  const [state, action] = useActionState(addExpense, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="grid grid-cols-2 gap-2">
      <input name="amount" inputMode="decimal" required placeholder="$ Monto" className={`${inputClass} tabular col-span-2 h-14 text-[22px] font-semibold`} />
      <select name="category" className={`${inputClass} col-span-2`} defaultValue="Productos e insumos" aria-label="Categoría">
        {EXPENSE_CATEGORIES.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>
      <input name="description" placeholder="Detalle (ej: acetona, luz de octubre)" className={`${inputClass} col-span-2`} />
      <input name="date" type="date" defaultValue={today} className={inputClass} aria-label="Fecha" />
      <select name="method" className={inputClass} defaultValue="efectivo" aria-label="Pagado con">
        <option value="efectivo">Efectivo de caja</option>
        <option value="transferencia">Transferencia</option>
        <option value="tarjeta">Tarjeta</option>
      </select>
      <div className="col-span-2">
        <FormMessage state={state} />
      </div>
      <div className="col-span-2">
        <SubmitButton>Anotar gasto</SubmitButton>
      </div>
    </form>
  );
}
