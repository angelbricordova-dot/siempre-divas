import type { Settings } from "@/db/schema";

export const DEFAULT_SETTINGS: Settings = {
  businessName: "Siempre Divas",
  tagline: "Salón de belleza en Guayaquil",
  address: "Chile y Febres Cordero",
  city: "Guayaquil, Ecuador",
  mapsUrl: "https://maps.google.com/?q=Chile+y+Febres+Cordero,+Guayaquil",
  whatsapp: "593964015681",
  instagram: "https://www.instagram.com/sb_siempredivas/",
  tiktok: "https://www.tiktok.com/@sd_siempredivas",
  hours: [
    null,
    { open: "09:00", close: "19:00" },
    { open: "09:00", close: "19:00" },
    { open: "09:00", close: "19:00" },
    { open: "09:00", close: "19:00" },
    { open: "09:00", close: "19:00" },
    { open: "09:00", close: "19:00" },
  ],
  slotMinutes: 30,
  minNoticeMinutes: 60,
  maxDaysAhead: 30,
  bookingEnabled: true,
  bookingPolicy:
    "Si no puedes asistir, avísanos por WhatsApp con al menos 3 horas de anticipación para darle tu turno a otra clienta.",
  ownerWhatsapp: "593964015681",
  callmebotApiKey: "",
  weekStartsOn: 0,
  payday: 6,
  aboutText:
    "Siempre Divas es el salón de Minerva en el centro de Guayaquil. Uñas, cabello, cejas y maquillaje con materiales de calidad y precios justos, para que salgas sintiéndote tú, pero en tu mejor versión.",
};

export const DEFAULT_CATALOG: {
  name: string;
  description: string;
  services: { name: string; price: number; from?: boolean; min: number; description?: string }[];
}[] = [
  {
    name: "Uñas",
    description: "Manos y pies, del esmalte clásico al acrílico.",
    services: [
      { name: "Manicure tradicional", price: 6, min: 30 },
      { name: "Esmalte semipermanente en manos", price: 8, min: 45 },
      { name: "Pedicure tradicional", price: 10, min: 45 },
      { name: "Pedicure con semipermanente", price: 14, min: 60 },
      { name: "Uñas acrílicas", price: 25, from: true, min: 120 },
      { name: "Polygel", price: 25, from: true, min: 105 },
      { name: "Retiro de acrílico o semipermanente", price: 5, min: 30 },
      { name: "Decoración nail art (por uña)", price: 1, min: 10 },
    ],
  },
  {
    name: "Cabello",
    description: "Cortes, color y tratamientos.",
    services: [
      { name: "Corte de dama", price: 8, from: true, min: 45 },
      { name: "Corte de caballero o niño", price: 5, min: 30 },
      { name: "Lavado y secado", price: 8, min: 40 },
      { name: "Cepillado o planchado", price: 10, from: true, min: 45 },
      { name: "Tinte de raíz", price: 25, from: true, min: 90 },
      { name: "Tinte completo", price: 35, from: true, min: 120 },
      { name: "Mechas o balayage", price: 60, from: true, min: 180 },
      { name: "Keratina", price: 50, from: true, min: 150 },
      { name: "Botox capilar", price: 40, from: true, min: 120 },
      { name: "Hidratación profunda", price: 15, min: 45 },
      { name: "Peinado para evento", price: 20, from: true, min: 60 },
    ],
  },
  {
    name: "Cejas y pestañas",
    description: "Mirada definida sin esfuerzo.",
    services: [
      { name: "Diseño de cejas", price: 5, min: 20 },
      { name: "Laminado de cejas", price: 20, min: 45 },
      { name: "Lifting de pestañas", price: 20, min: 60 },
      { name: "Pestañas pelo a pelo", price: 30, from: true, min: 90 },
    ],
  },
  {
    name: "Maquillaje",
    description: "Para el día, la noche o el gran día.",
    services: [
      { name: "Maquillaje social", price: 25, min: 60 },
      { name: "Maquillaje de novia", price: 60, from: true, min: 90 },
    ],
  },
  {
    name: "Depilación",
    description: "Con cera, rápida y cuidadosa.",
    services: [
      { name: "Cejas con cera", price: 4, min: 15 },
      { name: "Bozo", price: 3, min: 10 },
      { name: "Axilas", price: 6, min: 20 },
    ],
  },
];
