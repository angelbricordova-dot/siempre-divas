"use client";

import { useActionState, useState } from "react";
import { FormMessage, Sheet, SubmitButton } from "@/components/admin/client-ui";
import { buttonClass, inputClass } from "@/components/ui";
import { addAdvance } from "./actions";

export function AdvanceButton({ staffId, name }: { staffId: number; name: string }) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState(addAdvance, null);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass("secondary", "lg", "w-full")}>
        Dar adelanto
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={`Adelanto para ${name}`}>
        <form action={action} className="space-y-3 pb-2">
          <input type="hidden" name="staffId" value={staffId} />
          <label className="block">
            <span className="mb-1.5 block text-[14px] text-muted">Monto $</span>
            <input name="amount" inputMode="decimal" required autoFocus className={inputClass} placeholder="0" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] text-muted">Se entregó en</span>
            <select name="method" className={inputClass} defaultValue="efectivo">
              <option value="efectivo">Efectivo (sale de caja)</option>
              <option value="transferencia">Transferencia</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[14px] text-muted">Nota</span>
            <input name="note" className={inputClass} placeholder="Opcional" />
          </label>
          <FormMessage state={state} />
          <SubmitButton>Guardar adelanto</SubmitButton>
        </form>
      </Sheet>
    </>
  );
}
