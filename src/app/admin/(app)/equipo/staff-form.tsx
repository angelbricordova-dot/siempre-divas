"use client";

import { useActionState, useState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/client-ui";
import { Field, cx, inputClass, textareaClass } from "@/components/ui";
import { POSITIONS } from "@/lib/staff-name";
import { DAY_SHORT } from "@/lib/time";
import { saveStaff } from "./actions";

const COLORS = ["#C2185B", "#1565C0", "#00897B", "#7B1FA2", "#EF6C00", "#2E7D32", "#C9A45C", "#5D4037", "#0097A7", "#AD1457", "#455A64", "#9E9D24"];

type StaffRow = {
  id: number;
  name: string;
  lastName: string | null;
  position: string | null;
  username: string | null;
  role: "owner" | "staff";
  phone: string | null;
  commissionPct: number;
  color: string;
  specialty: string | null;
  bio: string | null;
  categoryIds: number[];
  daysOff: number[];
  bookable: boolean;
  showOnSite: boolean;
  active: boolean;
  passwordHash: string | null;
};

function Check({ name, label, hint, defaultChecked, disabled }: { name: string; label: string; hint?: string; defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-xl bg-surface-2 px-4 py-3">
      <span>
        <span className="block text-[16px]">{label}</span>
        {hint && <span className="block text-[13px] text-muted">{hint}</span>}
      </span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} disabled={disabled} className="h-6 w-6 accent-[var(--gold)]" />
    </label>
  );
}

export function StaffForm({
  staff,
  categories,
  usedColors = [],
}: {
  staff?: StaffRow;
  categories: { id: number; name: string }[];
  usedColors?: string[];
}) {
  const [state, action] = useActionState(saveStaff, null);
  // A cada integrante nueva le toca un color que nadie usa, para distinguirlas en la agenda.
  const used = usedColors.map((c) => c.toUpperCase());
  const [color, setColor] = useState(staff?.color ?? COLORS.find((c) => !used.includes(c)) ?? COLORS[0]);
  const isOwner = staff?.role === "owner";
  return (
    <form action={action} className="space-y-3">
      {staff && <input type="hidden" name="id" value={staff.id} />}
      <input type="hidden" name="color" value={color} />
      <div className="grid grid-cols-2 gap-2">
        <Field label="Nombre">
          <input name="name" defaultValue={staff?.name} required autoComplete="off" className={inputClass} />
        </Field>
        <Field label="Apellido">
          <input name="lastName" defaultValue={staff?.lastName ?? ""} autoComplete="off" className={inputClass} />
        </Field>
      </div>
      <Field label="Cargo" hint="Elige uno de la lista o escribe otro.">
        <input
          name="position"
          list="positions"
          defaultValue={staff?.position ?? (isOwner ? "Dueña" : "")}
          placeholder="Ej: Manicurista"
          autoComplete="off"
          className={inputClass}
        />
        <datalist id="positions">
          {POSITIONS.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </Field>
      <Field label="WhatsApp">
        <input name="phone" defaultValue={staff?.phone ? `0${staff.phone.slice(3)}` : ""} inputMode="tel" className={inputClass} />
      </Field>
      {!isOwner && (
        <Field label="% que gana de cada servicio" hint="Ej: 40 → de un servicio de $50 gana $20 y el salón $30.">
          <input name="commissionPct" inputMode="numeric" defaultValue={staff?.commissionPct ?? 40} required className={`${inputClass} tabular text-[20px] font-semibold`} />
        </Field>
      )}
      {isOwner && <input type="hidden" name="commissionPct" value={0} />}
      <Field label="Color en la agenda">
        <div className="flex flex-wrap gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={cx("press h-10 w-10 rounded-full", color === c && "ring-3 ring-ink ring-offset-2 ring-offset-surface")}
              style={{ background: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </Field>
      <Field label="Especialidad (opcional)" hint="Detalle que se ve al reservar, ej: uñas acrílicas y nail art.">
        <input name="specialty" defaultValue={staff?.specialty ?? ""} placeholder="Ej: Uñas acrílicas y nail art" className={inputClass} />
      </Field>
      <Field label="Sobre ella (opcional)">
        <textarea name="bio" defaultValue={staff?.bio ?? ""} className={textareaClass} />
      </Field>
      <fieldset>
        <legend className="mb-1.5 text-[14px] font-medium text-muted">¿Qué servicios hace? (vacío = todos)</legend>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <label key={c.id} className="press inline-flex h-11 items-center gap-2 rounded-full bg-surface-2 px-4 text-[15px] has-[:checked]:bg-ink has-[:checked]:text-bg">
              <input type="checkbox" name="categoryIds" value={c.id} defaultChecked={staff?.categoryIds.includes(c.id)} className="sr-only" />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 text-[14px] font-medium text-muted">Días que NO trabaja</legend>
        <div className="grid grid-cols-7 gap-1">
          {DAY_SHORT.map((d, i) => (
            <label key={d} className="press flex h-11 items-center justify-center rounded-xl bg-surface-2 text-[14px] has-[:checked]:bg-bad-soft has-[:checked]:text-bad">
              <input type="checkbox" name="daysOff" value={i} defaultChecked={staff?.daysOff.includes(i)} className="sr-only" />
              {d}
            </label>
          ))}
        </div>
      </fieldset>
      <Check name="bookable" label="Recibe reservas online" defaultChecked={staff?.bookable ?? true} />
      <Check name="showOnSite" label="Aparece en la web" defaultChecked={staff?.showOnSite ?? true} />
      {!isOwner && <Check name="active" label="Activa" hint="Apágala si ya no trabaja aquí (su historial se conserva)" defaultChecked={staff?.active ?? true} />}
      {isOwner && <input type="hidden" name="active" value="on" />}

      <div className="rounded-2xl bg-gold-soft p-4">
        <p className="text-[16px] font-semibold text-gold">Acceso a la app</p>
        <p className="mb-3 text-[14px] text-muted">
          {isOwner
            ? "Tu usuario para entrar al panel."
            : "Opcional. Con usuario y clave puede ver su agenda, registrar servicios y ver lo que gana."}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <input name="username" defaultValue={staff?.username ?? ""} placeholder="Usuario" autoCapitalize="none" className={inputClass} aria-label="Usuario" />
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder={staff?.passwordHash ? "Nueva clave (opcional)" : "Clave"}
            className={inputClass}
            aria-label="Clave"
          />
        </div>
      </div>
      <FormMessage state={state} />
      <SubmitButton>Guardar</SubmitButton>
    </form>
  );
}
