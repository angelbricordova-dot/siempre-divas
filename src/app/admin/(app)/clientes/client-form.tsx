"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/client-ui";
import { Field, inputClass, textareaClass } from "@/components/ui";
import { saveClient } from "./actions";

export function ClientForm({
  client,
}: {
  client?: { id: number; name: string; phone: string | null; birthday: string | null; notes: string | null };
}) {
  const [state, action] = useActionState(saveClient, null);
  return (
    <form action={action} className="space-y-3">
      {client && <input type="hidden" name="id" value={client.id} />}
      <Field label="Nombre">
        <input name="name" defaultValue={client?.name} required className={inputClass} />
      </Field>
      <Field label="WhatsApp">
        <input name="phone" defaultValue={client?.phone ? `0${client.phone.slice(3)}` : ""} inputMode="tel" className={inputClass} placeholder="09…" />
      </Field>
      <Field label="Cumpleaños">
        <input name="birthday" type="date" defaultValue={client?.birthday ?? ""} className={inputClass} />
      </Field>
      <Field label="Notas" hint="Fórmula de tinte, alergias, gustos…">
        <textarea name="notes" defaultValue={client?.notes ?? ""} className={textareaClass} />
      </Field>
      <FormMessage state={state} />
      <SubmitButton>{client ? "Guardar cambios" : "Crear clienta"}</SubmitButton>
    </form>
  );
}
