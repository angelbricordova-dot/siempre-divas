"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/admin/client-ui";
import { Field, inputClass, textareaClass } from "@/components/ui";
import type { Settings } from "@/db/schema";
import { DAY_NAMES } from "@/lib/time";
import { changePassword, saveBusiness, saveNotifications } from "./actions";

const local = (p: string) => (p?.startsWith("593") ? `0${p.slice(3)}` : (p ?? ""));

export function BusinessForm({ s }: { s: Settings }) {
  const [state, action] = useActionState(saveBusiness, null);
  return (
    <form action={action} className="space-y-3">
      <Field label="Nombre del salón">
        <input name="businessName" defaultValue={s.businessName} className={inputClass} />
      </Field>
      <Field label="Frase corta">
        <input name="tagline" defaultValue={s.tagline} className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Dirección">
          <input name="address" defaultValue={s.address} className={inputClass} />
        </Field>
        <Field label="Ciudad">
          <input name="city" defaultValue={s.city} className={inputClass} />
        </Field>
      </div>
      <Field label="Enlace de Google Maps">
        <input name="mapsUrl" defaultValue={s.mapsUrl} className={inputClass} />
      </Field>
      <Field label="WhatsApp del salón (público)">
        <input name="whatsapp" defaultValue={local(s.whatsapp)} inputMode="tel" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Instagram">
          <input name="instagram" defaultValue={s.instagram} className={inputClass} />
        </Field>
        <Field label="TikTok">
          <input name="tiktok" defaultValue={s.tiktok} className={inputClass} />
        </Field>
      </div>
      <Field label="Sobre el salón (texto de la web)">
        <textarea name="aboutText" defaultValue={s.aboutText} className={textareaClass} />
      </Field>

      <fieldset className="rounded-2xl bg-surface-2 p-3">
        <legend className="px-1 text-[14px] font-medium text-muted">Horario de atención</legend>
        <div className="space-y-1.5">
          {DAY_NAMES.map((d, i) => {
            const h = s.hours[i];
            return (
              <div key={d} className="grid grid-cols-[auto_1fr_1fr] items-center gap-2">
                <label className="flex w-28 items-center gap-2 text-[15px]">
                  <input type="checkbox" name={`open_${i}`} defaultChecked={!!h} className="h-5 w-5 accent-[var(--gold)]" />
                  {d}
                </label>
                <input type="time" name={`from_${i}`} defaultValue={h?.open ?? "09:00"} className="h-11 rounded-lg bg-surface px-2 text-[15px]" aria-label={`${d} abre`} />
                <input type="time" name={`to_${i}`} defaultValue={h?.close ?? "19:00"} className="h-11 rounded-lg bg-surface px-2 text-[15px]" aria-label={`${d} cierra`} />
              </div>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3 rounded-2xl bg-surface-2 p-3">
        <legend className="px-1 text-[14px] font-medium text-muted">Reservas online</legend>
        <label className="flex items-center justify-between text-[16px]">
          Aceptar reservas desde la web
          <input type="checkbox" name="bookingEnabled" defaultChecked={s.bookingEnabled} className="h-6 w-6 accent-[var(--gold)]" />
        </label>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Turnos cada (min)">
            <input name="slotMinutes" inputMode="numeric" defaultValue={s.slotMinutes} className={inputClass} />
          </Field>
          <Field label="Aviso mínimo (min)">
            <input name="minNoticeMinutes" inputMode="numeric" defaultValue={s.minNoticeMinutes} className={inputClass} />
          </Field>
          <Field label="Hasta (días)">
            <input name="maxDaysAhead" inputMode="numeric" defaultValue={s.maxDaysAhead} className={inputClass} />
          </Field>
        </div>
        <Field label="Política (se muestra al reservar)">
          <textarea name="bookingPolicy" defaultValue={s.bookingPolicy} className={textareaClass} />
        </Field>
      </fieldset>

      <Field label="La semana de cuentas empieza el" hint="Para los resúmenes semanales. Los pagos al equipo se pueden hacer cualquier día.">
        <select name="weekStartsOn" defaultValue={s.weekStartsOn} className={inputClass}>
          {DAY_NAMES.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </Field>
      <FormMessage state={state} />
      <SubmitButton>Guardar</SubmitButton>
    </form>
  );
}

export function NotificationsForm({ s }: { s: Settings }) {
  const [state, action] = useActionState(saveNotifications, null);
  return (
    <form action={action} className="space-y-3">
      <Field label="Tu WhatsApp personal">
        <input name="ownerWhatsapp" defaultValue={local(s.ownerWhatsapp)} inputMode="tel" className={inputClass} />
      </Field>
      <Field label="Clave de CallMeBot (apikey)">
        <input name="callmebotApiKey" defaultValue={s.callmebotApiKey} className={inputClass} autoComplete="off" />
      </Field>
      <details className="rounded-xl bg-surface-2 p-3 text-[14px] text-muted">
        <summary className="cursor-pointer font-medium text-ink">¿Cómo obtengo la clave? (2 minutos, gratis)</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>
            Abre <a className="font-semibold text-gold" href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" rel="noreferrer">callmebot.com</a> y copia el número del bot que aparece ahí.
          </li>
          <li>Guárdalo en tus contactos del celular.</li>
          <li>
            Envíale por WhatsApp: <b className="text-ink">I allow callmebot to send me messages</b>
          </li>
          <li>Te responderá con tu “apikey”. Pégala aquí y toca “Probar”.</li>
        </ol>
      </details>
      <FormMessage state={state} />
      <div className="grid grid-cols-2 gap-2">
        <SubmitButton variant="secondary" size="lg" name="test" value="1" pendingText="Enviando…">
          Probar
        </SubmitButton>
        <SubmitButton size="lg">Guardar</SubmitButton>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, null);
  return (
    <form action={action} className="space-y-3">
      <input name="current" type="password" placeholder="Clave actual" autoComplete="current-password" className={inputClass} required />
      <input name="next" type="password" placeholder="Nueva clave" autoComplete="new-password" className={inputClass} required />
      <FormMessage state={state} />
      <SubmitButton size="md">Cambiar clave</SubmitButton>
    </form>
  );
}
