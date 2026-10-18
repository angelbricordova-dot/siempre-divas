"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/client-ui";
import { Field, inputClass, textareaClass } from "@/components/ui";
import { moneyInput } from "@/lib/money";
import { saveService } from "./actions";

type Svc = {
  id: number;
  name: string;
  categoryId: number;
  description: string | null;
  price: number;
  priceFrom: boolean;
  durationMin: number;
  commissionPct: number | null;
  bookable: boolean;
  showOnSite: boolean;
  active: boolean;
};

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
      <span>
        <span className="block text-[16px]">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-6 w-6 accent-[var(--gold)]" />
    </label>
  );
}

export function ServiceForm({ service, categories, defaultCategory }: { service?: Svc; categories: { id: number; name: string }[]; defaultCategory?: number }) {
  const [state, action] = useActionState(saveService, null);
  return (
    <form action={action} className="space-y-3">
      {service && <input type="hidden" name="id" value={service.id} />}
      <Field label="Nombre">
        <input name="name" defaultValue={service?.name} required className={inputClass} />
      </Field>
      <Field label="Categoría">
        <select name="categoryId" defaultValue={service?.categoryId ?? defaultCategory} className={inputClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Precio $">
          <input name="price" inputMode="decimal" defaultValue={service ? moneyInput(service.price) : ""} required className={inputClass} />
        </Field>
        <Field label="Duración (min)">
          <input name="durationMin" inputMode="numeric" defaultValue={service?.durationMin ?? 60} className={inputClass} />
        </Field>
      </div>
      <Toggle name="priceFrom" label="Mostrar “desde”" hint="Para precios que varían según el largo o diseño" defaultChecked={service?.priceFrom} />
      <Field label="Descripción (se ve en la web)">
        <textarea name="description" defaultValue={service?.description ?? ""} className={textareaClass} />
      </Field>
      <Field label="% para la trabajadora en este servicio" hint="Déjalo vacío para usar el % de cada trabajadora.">
        <input name="commissionPct" inputMode="numeric" defaultValue={service?.commissionPct ?? ""} placeholder="Ej: 40" className={inputClass} />
      </Field>
      <Toggle name="bookable" label="Se puede reservar online" defaultChecked={service?.bookable ?? true} />
      <Toggle name="showOnSite" label="Mostrar en la web" defaultChecked={service?.showOnSite ?? true} />
      <Toggle name="active" label="Activo" hint="Si lo apagas, desaparece de la caja y la web" defaultChecked={service?.active ?? true} />
      <FormMessage state={state} />
      <SubmitButton>Guardar</SubmitButton>
    </form>
  );
}
