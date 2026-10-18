"use client";

import { useEffect, useState } from "react";
import { IconBell } from "./icons";

const KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export function RegisterSW() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

export function PushToggle() {
  const [state, setState] = useState<"idle" | "on" | "busy" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (!KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }
    if (Notification.permission === "denied") setState("denied");
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => sub && setState("on"))
      .catch(() => {});
  }, []);

  async function enable() {
    try {
      setState("busy");
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(KEY!),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
      setState("on");
    } catch {
      setState("idle");
    }
  }

  if (state === "unsupported") return null;
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold-soft text-gold">
        <IconBell width={20} height={20} />
      </span>
      <div className="flex-1">
        <p className="text-[16px] font-medium">Avisos en este celular</p>
        <p className="text-[13px] text-muted">
          {state === "on"
            ? "Activados: te avisaremos de citas nuevas y cobros pendientes."
            : state === "denied"
              ? "Bloqueados. Actívalos en los ajustes del navegador."
              : "Recibe un aviso al instante cuando entre una cita."}
        </p>
      </div>
      {state !== "on" && state !== "denied" && (
        <button onClick={enable} disabled={state === "busy"} className="press h-10 rounded-xl bg-gold px-4 text-[15px] font-semibold text-on-gold">
          {state === "busy" ? "…" : "Activar"}
        </button>
      )}
    </div>
  );
}
