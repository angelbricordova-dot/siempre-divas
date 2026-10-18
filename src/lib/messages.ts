// Textos prellenados para WhatsApp (los emojis van en el mensaje, no en la interfaz).
export const MSG = {
  info: "Hola Siempre Divas 💛 Quisiera información",
  hello: "Hola Siempre Divas 💛",
  promo: (title: string) => `Hola 💛 Quiero la promo “${title}”`,
  dayFull: (date: string) => `Hola 💛 Busco turno el ${date}`,
  book: "Hola 💛 Quiero agendar una cita",
  booked: (services: string, when: string, name: string) =>
    `Hola Siempre Divas 💛 Acabo de reservar desde la web: ${services} el ${when}. Soy ${name}.`,
};
