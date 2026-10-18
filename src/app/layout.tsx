import type { Metadata, Viewport } from "next";
import { TikTok_Sans } from "next/font/google";
import "./globals.css";

const tiktok = TikTok_Sans({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-tiktok",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://siempredivas.vercel.app"),
  title: {
    default: "Siempre Divas · Salón de belleza en Guayaquil",
    template: "%s · Siempre Divas",
  },
  description:
    "Uñas, cabello, cejas, pestañas y maquillaje en Guayaquil (Chile y Febres Cordero). Reserva tu cita en línea en menos de un minuto.",
  applicationName: "Siempre Divas",
  appleWebApp: { capable: true, title: "Siempre Divas", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    locale: "es_EC",
    siteName: "Siempre Divas",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1eb" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0c0a" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-EC" className={tiktok.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
