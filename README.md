# Siempre Divas

Página web y app de administración del salón de belleza **Siempre Divas** (Guayaquil, Ecuador).

- **Web pública** (`/`): servicios y precios, promos, equipo, preguntas frecuentes, contacto y **reserva de citas en línea** (`/reservar`).
- **App de administración** (`/admin`): pensada para usarse desde el celular e instalable como app (PWA).

## Qué resuelve para Minerva

| Antes | Ahora |
| --- | --- |
| Anotaba cada cobro en un cuaderno y esperaba al fin de semana para sacar cuentas. | Cada cobro reparte **al instante** lo que gana la trabajadora y lo que queda para el salón. |
| Sumaba a mano el porcentaje de cada una. | **Cuentas** muestra en todo momento cuánto se le debe a cada una (comisión + propinas − adelantos). |
| Calculaba el pago semanal. | Un botón **Pagar** liquida todo lo pendiente, guarda el historial y envía el comprobante por WhatsApp. |
| Las citas llegaban por mensajes sueltos. | Agenda con horarios libres reales; cada reserva web o de una trabajadora **le llega a su WhatsApp personal**. |

### Funciones

**Caja (Cobrar)**
- Toca quién atendió, toca los servicios y edita el precio si cambia; también acepta montos libres.
- Ticket con varias trabajadoras, descuento (se reparte proporcionalmente), propina (100 % para quien atendió) y forma de pago (efectivo, transferencia, De Una o tarjeta).
- Las trabajadoras registran desde su celular lo que hicieron, y el servicio llega a la dueña como **«Por cobrar»**.
- Recibo para la clienta por WhatsApp.
- Las ventas del día se pueden anular, salvo los cobros que ya entraron en un pago.

**Cuentas**
- Saldo por trabajadora en tiempo real, con el detalle de cada servicio día por día.
- Adelantos («vales») que se descuentan solos en el siguiente pago.
- Pago con un toque, historial y comprobante por WhatsApp.
- Cada servicio guarda el porcentaje vigente en ese momento, así que cambiar el % no altera lo anterior.

**Agenda**
- Vista por día y por trabajadora, con citas por confirmar resaltadas.
- Los horarios libres salen del horario del salón, de los días libres de cada una, de lo que sabe hacer cada una y de lo ya agendado.
- Confirmación y recordatorio por WhatsApp con un toque, y paso de «cita atendida» a cobro.
- Registro de «No vino» (cuenta las faltas de la clienta), cancelación y reprogramación.

**Clientas**
- Historial, total gastado, faltas y notas (por ejemplo, fórmula de tinte o alergias).
- Filtros: cumpleaños del mes, clientas que no vuelven hace más de 45 días (con mensaje «Te extrañamos») y las más fieles.

**Además**
- **Gastos** por categoría y **Ganancia neta** (parte del salón − gastos).
- **Cierre de caja**: cuánto efectivo debe haber y la diferencia con lo contado.
- **Reportes**: por día, semana o mes, por trabajadora, servicios más pedidos y medios de pago. Se exportan a Excel (CSV).
- **Servicios y precios**, **Equipo** (porcentaje, días libres, especialidades, color y acceso a la app) y **Promos y galería**. Lo que se cambie aquí se publica en la web al instante; las fotos se suben desde el celular y se comprimen solas.
- **Avisos**: WhatsApp a la dueña (gratis, vía CallMeBot) y notificaciones push en la app instalada.
- Roles: la **dueña** ve todo; cada **trabajadora** ve solo su agenda y lo que ella gana.

## Tecnología

- Next.js 16 (App Router, Server Actions) + React 19 + Tailwind CSS 4.
- PostgreSQL con Drizzle ORM. En Vercel se recomienda **Neon**, que tiene plan gratuito.
- Sesiones con JWT en cookie httpOnly y claves cifradas con bcrypt.
- Las imágenes se guardan en la base de datos, comprimidas a WebP en el celular antes de subirlas.

## Publicar en Vercel (paso a paso)

1. **Importa el repositorio** en [vercel.com/new](https://vercel.com/new). Vercel detecta Next.js solo.
2. **Crea la base de datos**: en el proyecto de Vercel ve a *Storage → Create Database → Neon (Postgres)* y conéctala al proyecto. Eso crea `DATABASE_URL` y `DATABASE_URL_UNPOOLED`.
3. **Agrega las variables de entorno** en *Settings → Environment Variables*:

   | Variable | Valor |
   | --- | --- |
   | `AUTH_SECRET` | Un texto largo y aleatorio. Genéralo con `openssl rand -base64 32`. |
   | `ADMIN_PASSWORD` | La primera clave de Minerva (usuario `minerva`). Puede cambiarla luego en *Ajustes*. |
   | `NEXT_PUBLIC_SITE_URL` | La URL final, por ejemplo `https://siempredivas.com`. |
   | `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY` | Opcional, para avisos push. Genéralas con `npx web-push generate-vapid-keys`. |
   | `CALLMEBOT_APIKEY` | Opcional. También se puede poner desde *Ajustes* dentro de la app. |

4. **Despliega** (*Deploy*). El build aplica las migraciones y crea los datos iniciales: los ajustes del salón, el catálogo de servicios con precios de ejemplo y la cuenta de Minerva.
5. Entra a `https://tu-dominio/admin` con el usuario `minerva` y la clave de `ADMIN_PASSWORD`.
6. En el celular de Minerva, abre `/admin` y elige **«Agregar a pantalla de inicio»** para usarlo como app.

### WhatsApp automático a la dueña (gratis)

1. En la app: *Más → Ajustes → Avisos a tu WhatsApp*.
2. Sigue las instrucciones: guarda el número del bot de [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/) y envíale `I allow callmebot to send me messages`.
3. Pega la clave (apikey) que te responde y toca **Probar**.

## Primeros pasos para Minerva

1. Revisa **Servicios y precios**. Los precios iniciales son de ejemplo, así que cámbialos por los reales.
2. Agrega a tu **Equipo** con su porcentaje, sus días libres, lo que sabe hacer y, si quieres, su usuario y clave.
3. Ajusta el **horario del salón** en *Ajustes*.
4. Sube fotos de tus trabajos en **Promos y galería**. La galería aparece en la web cuando hay 3 fotos o más.

## Desarrollo local

```bash
npm install
cp .env.example .env.local   # completa DATABASE_URL, AUTH_SECRET y ADMIN_PASSWORD
npm run db:migrate           # migraciones y datos iniciales
npm run db:demo              # opcional: trabajadoras y ventas de DEMOSTRACIÓN (solo local)
npm run dev
```

Otros comandos:

- `npm run db:generate`: crea una migración después de cambiar `src/db/schema.ts`.
- `node scripts/brand/build-logo.mjs <carpeta-fuentes>`: regenera el logo y los íconos.

## Marca

El logo es 100 % vectorial (`public/brand/`), con el texto convertido a trazos. El punto de la «i» de *Divas* es una corona, que retoma la corona del logo anterior. Versiones disponibles:

- `logo-*.svg`: apilado (SIEMPRE / Divas / SALÓN DE BELLEZA).
- `logo-horizontal-*.svg`: en una línea.
- `monogram-*.svg` y `app-icon.svg`: la D con corona.

Cada una existe en dorado, marfil y negro. Tipografía del logo: Bodoni Moda (OFL). Tipografía de la web y la app: TikTok Sans (OFL).
