# Investigación: webs y software de salones de belleza

Resumen de las referencias revisadas antes de diseñar Siempre Divas: qué hacen bien, qué errores repiten y cómo se aplicó cada punto en este proyecto.

> Nota sobre el método: desde el entorno de desarrollo solo se pudo usar el buscador web; las páginas no se pudieron abrir directamente. Las conclusiones vienen de recopilaciones de 2024–2026 de webs de salones, de guías de UX de reservas y de la documentación de software de salones (Fresha, Booksy, Vagaro, Zenoti, TressyPOS, AgendaPro). Además, la dirección de arte se tomó de la skill *taste*, construida a partir de un estudio de 247 sitios premiados (Awwwards y One Page Love).

## 1. Lo mejor de cada referencia

| Referencia | Qué hace bien | Cómo se aplicó |
| --- | --- | --- |
| **The Lane** (San Francisco), según Mangomint | Navegación limpia: carta de servicios, reserva y tienda a un clic. Fotografía coherente. | Menú de 3 enlaces más «Reservar». Cada servicio de la carta lleva directo a reservarlo. |
| **Grand Noir Salon** (Colorlib 2026) | Diseño oscuro y minimalista con **precios claros** a la vista. | Fondo negro de la marca y carta completa de precios con duración, sin tener que escribir para preguntar. |
| **Salon SCK** (Colorlib 2026) | Imagen de alto nivel y reserva sencilla. | Portada tipográfica de impacto y reserva en una sola pantalla. |
| **Mèche Salon** (CyberOptik/UPQODE) | Fotos de transformaciones de alta calidad. | Galería alimentada por Minerva desde el celular con sus propios trabajos. |
| **The Cosmo Studio** (uñas) | Galería de nail art estilo Instagram muy visible. | Bloque de Instagram y TikTok mientras no haya fotos; galería horizontal cuando las haya. |
| **Paint Nail Bar** | Tipografía sofisticada, con una Didone (tipo Didot) para la marca. | Logo en Bodoni Moda, de la misma familia Didone. |
| **Plantillas de lujo** (Framer Lumière, conceptos en Contra) | Negro con acentos dorados y espacios generosos. | Paleta negro, hueso y dorado, que conserva el reconocimiento de la marca actual. |
| **Zenoti y Vagaro** (software) | Comisión por profesional y por tipo de servicio; propinas a quien atendió. | % por trabajadora con posibilidad de % fijo por servicio. La propina va 100 % a quien atendió. |
| **TressyPOS** | Cierre de caja diario, adelantos al personal y nómina con descuentos. | Cierre de caja, adelantos que se descuentan solos y pagos con comprobante. |
| **Booksy** | App para que cada profesional vea su agenda. | Acceso para cada trabajadora: su agenda, registrar servicios y ver lo que gana. |

## 2. Errores frecuentes y cómo se evitaron

| Error común | Fuente | Solución en Siempre Divas |
| --- | --- | --- |
| El botón de reservar está escondido o desaparece en el celular. | Zenoti, salonbookingsystem.com | «Reservar» en el menú, en la portada, en la carta y como botón fijo en el celular. |
| Formulario de reserva mezclado con otro contenido. | salonbookingsystem.com | Página dedicada `/reservar`, con solo lo necesario. |
| Sistemas de reserva pensados para computadora. | Zenoti (encuesta propia: 80 % reserva desde el celular) | Todo se diseñó primero para celular: botones de 48 px o más, fechas y horas grandes. |
| Pedir demasiados datos antes de reservar. | Zenoti | Solo nombre y WhatsApp. |
| No mostrar la disponibilidad de cada profesional. | Zenoti (+28 % de conversión al mostrarla) | Se elige profesional o «quien esté libre», y solo aparecen las horas realmente libres. |
| No ofrecer alternativa cuando no hay hueco. | Varias guías | Si el día está lleno, aparece el enlace directo a WhatsApp. |
| Falta de políticas claras (cancelación, precios variables). | StyleSeat, Kitomba, DaySmart | La política se ve al reservar y en la confirmación. Los precios «desde» se explican. |
| Faltas sin seguimiento. | SalonIQ, alteg.io | Confirmación y recordatorio por WhatsApp con un toque, y contador de faltas por clienta. |
| Comisiones que se calculan aparte y se copian a otra hoja. | Zenoti | El reparto se calcula al cobrar y queda guardado; se puede exportar a Excel. |
| Páginas genéricas, con aspecto de plantilla. | Estudio de la skill *taste* | Dirección de arte «el nombre como monumento», sin tarjetas con íconos, degradados ni sombras decorativas. |

## 3. Contexto local (Ecuador y Latinoamérica)

- Muchos salones de la región todavía agendan por teléfono, por mensajes de WhatsApp sin orden o en libretas, lo que provoca errores y citas duplicadas (Aurora Inbox). Por eso la agenda vive en la app y WhatsApp se usa solo para avisar y confirmar.
- WhatsApp es el canal natural: la clienta manda una foto de referencia y confirma en la misma conversación (SchedulingKit). Por eso todos los botones de contacto abren WhatsApp con el mensaje ya escrito.
- Más del 65 % de las reservas se hacen fuera del horario de atención (estudio de Square de 2023, citado por AgendaPro). La reserva web funciona las 24 horas y avisa a Minerva al instante.
- Medios de pago locales: efectivo, transferencia, **De Una** (Banco Pichincha) y tarjeta.

## 4. Fuentes

- [7 beautiful hair salon web designs (Mangomint)](https://mangomint.com/blog/7-beautiful-hair-salon-web-designs)
- [Hair salon websites design (Colorlib)](https://colorlib.com/wp/hair-salon-websites-design/)
- [Nail salon website examples (Colorlib)](https://colorlib.com/wp/nail-salon-website-examples/)
- [Best salon websites (My Codeless Website)](https://mycodelesswebsite.com/salon-websites/)
- [Best beauty salon website examples (UPQODE)](https://upqode.com/best-beauty-salon-website-examples/)
- [Best salon websites (CyberOptik)](https://cyberoptik.net/blog/best-salon-websites)
- [Hair salon websites (Lovable)](https://lovable.dev/en/guides/hair-salon-websites)
- [7 booking mistakes that cost salons money (Zenoti)](https://www.zenoti.com/thecheckin/salon-booking-mistakes)
- [How to improve your salon’s website (Salon Booking System)](https://www.salonbookingsystem.com/blog/tips-suggestions/how-to-improve-your-salons-website/)
- [Hair salon landing page strategy 2026 (Unicorn Platform)](https://unicornplatform.com/blog/hair-salon-landing-page-strategy-in-2026/)
- [Reduce no-shows (Kitomba)](https://www.kitomba.com/blog/reduce-no-shows-in-your-salon-proven-strategies-that-actually-work/)
- [Salon no-show policy (StyleSeat)](https://www.styleseat.com/blog/salon-no-show-policy/)
- [Reminders and deposits (alteg.io)](https://alteg.io/en/blog/how-to-reduce-no-shows/)
- [Best salon commission payroll software (Zenoti)](https://www.zenoti.com/thecheckin/best-salon-commission-payroll-software)
- [Salon employee management software (Booksy)](https://biz.booksy.com/blog/do-you-need-salon-employee-management-software)
- [TressyPOS (Trustpilot)](https://au.trustpilot.com/review/tressypos.com)
- [WhatsApp como motor de ventas (AgendaPro)](https://agendapro.com/blog/whatsapp-como-motor-de-ventas/)
- [Guía de reservas online (AgendaPro)](https://agendapro.com/blog/guia-definitiva-para-las-reservas-online-en-negocios-de-belleza/)
- [WhatsApp booking for salons (SchedulingKit)](https://schedulingkit.com/es/whatsapp-booking/salons)
- [Tendencias en spas de uñas de Guayaquil 2023 (UPS)](https://dspace.ups.edu.ec/handle/123456789/27983?mode=full)
- [CallMeBot: WhatsApp gratis](https://www.callmebot.com/blog/free-api-whatsapp-messages/)
