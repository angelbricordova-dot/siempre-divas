"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { FormMessage } from "@/components/admin/client-ui";
import { Field, inputClass, textareaClass } from "@/components/ui";
import { savePromo, uploadGallery } from "./actions";

/** Reduce la foto en el celular antes de subirla (WebP, máx. 1600 px). */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", 0.82));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
}

function useCompressedSubmit(action: (fd: FormData) => void, field: string) {
  const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const files = fd.getAll(field).filter((f): f is File => f instanceof File && f.size > 0);
    fd.delete(field);
    for (const f of files) fd.append(field, await compress(f));
    setBusy(false);
    startTransition(() => action(fd));
  }
  return { busy, onSubmit };
}

export function GalleryUpload({ categories, staff }: { categories: { id: number; name: string }[]; staff: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(uploadGallery, null);
  const ref = useRef<HTMLFormElement>(null);
  const { busy, onSubmit } = useCompressedSubmit(action, "files");
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      <label className="flex h-28 cursor-pointer flex-col items-center justify-center rounded-2xl bg-surface-2 text-center text-[15px] text-muted has-[:valid]:bg-gold-soft">
        <span className="text-[17px] font-semibold text-gold">Elegir fotos</span>
        <span>puedes elegir varias a la vez</span>
        <input type="file" name="files" accept="image/*" multiple required className="sr-only" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <select name="categoryId" className={inputClass} defaultValue="" aria-label="Tipo de trabajo" required>
          <option value="" disabled>
            Tipo de trabajo
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="staffId" className={inputClass} defaultValue="" aria-label="Quién lo hizo">
          <option value="">¿Quién lo hizo?</option>
          {staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <input name="alt" placeholder="Descripción (ej: corte bob con mechas miel)" className={inputClass} />
      <label className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-[16px]">
        <span>
          Destacar en la portada
          <span className="block text-[13px] text-muted">Las destacadas salen primero</span>
        </span>
        <input type="checkbox" name="featured" className="h-6 w-6 accent-[var(--gold)]" />
      </label>
      <FormMessage state={state} />
      <button disabled={busy || pending} className="press h-14 w-full rounded-xl bg-gold text-[17px] font-semibold text-on-gold disabled:opacity-50">
        {busy ? "Preparando…" : pending ? "Subiendo…" : "Subir a la galería"}
      </button>
    </form>
  );
}

export function PromoForm({
  promo,
}: {
  promo?: { id: number; title: string; description: string | null; priceText: string | null; validUntil: string | null; active: boolean };
}) {
  const [state, action, pending] = useActionState(savePromo, null);
  const ref = useRef<HTMLFormElement>(null);
  const { busy, onSubmit } = useCompressedSubmit(action, "file");
  useEffect(() => {
    if (state?.ok && !promo) ref.current?.reset();
  }, [state, promo]);
  return (
    <form ref={ref} onSubmit={onSubmit} className="space-y-3">
      {promo && <input type="hidden" name="id" value={promo.id} />}
      <Field label="Título">
        <input name="title" defaultValue={promo?.title} required placeholder="Ej: Manos + pies semipermanente" className={inputClass} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Precio">
          <input name="priceText" defaultValue={promo?.priceText ?? ""} placeholder="$20" className={inputClass} />
        </Field>
        <Field label="Válida hasta">
          <input name="validUntil" type="date" defaultValue={promo?.validUntil ?? ""} className={inputClass} />
        </Field>
      </div>
      <Field label="Detalle">
        <textarea name="description" defaultValue={promo?.description ?? ""} className={textareaClass} />
      </Field>
      <Field label="Imagen (opcional)">
        <input type="file" name="file" accept="image/*" className="block w-full text-[15px]" />
      </Field>
      <label className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3 text-[16px]">
        Mostrar en la web
        <input type="checkbox" name="active" defaultChecked={promo?.active ?? true} className="h-6 w-6 accent-[var(--gold)]" />
      </label>
      <FormMessage state={state} />
      <button disabled={busy || pending} className="press h-14 w-full rounded-xl bg-gold text-[17px] font-semibold text-on-gold disabled:opacity-50">
        {busy || pending ? "Guardando…" : "Guardar promo"}
      </button>
    </form>
  );
}

