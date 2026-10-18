import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Siempre Divas · Administración",
    short_name: "Siempre Divas",
    description: "Caja, cuentas, citas y clientas del salón Siempre Divas.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e0c0a",
    theme_color: "#0e0c0a",
    lang: "es-EC",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Cobrar", url: "/admin/caja" },
      { name: "Agenda", url: "/admin/agenda" },
      { name: "Cuentas", url: "/admin/cuentas" },
    ],
  };
}
