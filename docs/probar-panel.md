# Cómo probar el panel de administración

Guía corta para revisar el panel antes de entregárselo a Minerva. Se tarda unos 15 minutos y conviene hacerlo **desde el celular**, que es donde ella lo va a usar.

## 0. Antes de empezar

1. Publica el proyecto en Vercel siguiendo el `README.md` (con la base de datos Neon y las variables `AUTH_SECRET` y `ADMIN_PASSWORD`).
2. Abre `https://TU-DOMINIO/admin` en el celular.
3. Entra con el usuario **minerva** y la clave que pusiste en `ADMIN_PASSWORD`.
4. En el menú del navegador elige **«Agregar a pantalla de inicio»**. Desde ese momento se abre como una app, con su ícono dorado.

> Consejo: haz las pruebas en una base de datos de prueba. Antes de entregarlo, crea en Neon una base nueva y vacía, y cambia `DATABASE_URL` en Vercel. Así Minerva arranca sin datos de prueba.

## 1. Arma el equipo y los precios

| Haz esto | Deberías ver |
| --- | --- |
| **Más → Equipo → Agregar**: crea 2 trabajadoras con nombre, apellido, cargo y % (ej. 40 y 50). Dale a una un usuario y una clave. | Aparecen en la lista con su cargo y cada una con un color distinto. |
| **Más → Servicios y precios**: cambia un precio. | Abre la página web y el precio ya está cambiado. |
| **Más → Ajustes**: revisa el horario. | La reserva web solo ofrece horas dentro de ese horario. |

## 2. Cobrar (lo más importante)

| Haz esto | Deberías ver |
| --- | --- |
| Toca **Cobrar** (el botón dorado del centro). Elige una trabajadora, toca un servicio y cambia el precio a $50. | Abajo aparece el reparto en vivo, por ejemplo «Ana $20 · Salón $30» con 40 %. |
| Elige **Efectivo** y toca **Cobrar**. | Pantalla de «Cobrado $50» con lo que gana cada una. |
| Repite con dos servicios hechos por dos trabajadoras distintas (cambia «Lo hizo» en el segundo). | Cada una recibe su parte. |
| Prueba **Descuento** y **Propina**. | El descuento se reparte; la propina va completa a quien atendió. |

## 3. Lo que registra una trabajadora

| Haz esto | Deberías ver |
| --- | --- |
| Cierra sesión (**Más → Cerrar sesión**) y entra con el usuario de la trabajadora. | Su pantalla de inicio: «Ganaste hoy», «Tu próximo pago» y el botón **Registrar un servicio**. |
| Registra un servicio y toca **Enviar a caja**. | «Enviado a caja». La trabajadora no ve las cuentas de las demás ni el dinero del salón. |
| Vuelve a entrar como Minerva. | En Inicio aparece «Por cobrar 1»; al tocarlo se abre listo para elegir el pago y cobrar. |

## 4. Cuentas: el fin del cuaderno

| Haz esto | Deberías ver |
| --- | --- |
| Toca **Cuentas**. | Cuánto se le debe a cada una **hoy**, sin esperar al fin de semana. |
| Entra a una trabajadora → **Dar adelanto** de $10. | Su saldo baja $10. |
| Toca **Pagar**. | Comprobante del pago; si tiene WhatsApp guardado, botón para enviárselo. Su saldo vuelve a $0. |
| **Historial de pagos**. | Queda registrado cada pago. |

## 5. Citas

| Haz esto | Deberías ver |
| --- | --- |
| En la **página web**, toca **Reservar**, elige un servicio, un día y una hora, y pon tu nombre y tu WhatsApp. | «¡Lista, diva!» con el resumen de la cita y el botón para guardarla en el calendario. |
| Entra al panel. | En Inicio: «Cita nueva por confirmar». |
| Abre la cita → **Confirmar cita** → **Confirmación** (WhatsApp). | Se abre WhatsApp con el mensaje de confirmación ya escrito para la clienta. |
| Toca **Atendida: cobrar**. | Abre la caja con los servicios de la cita ya cargados. |
| **Agenda → Nueva cita** desde el panel. | Solo ofrece horas libres de la persona elegida. |

## 6. Trabajos (fotos para la web)

| Haz esto | Deberías ver |
| --- | --- |
| **Más → Trabajos y promos → Elegir fotos**: elige varias fotos de cortes. Indica el tipo (Cabello), quién lo hizo y marca **Destacar**. | «Fotos agregadas». Las fotos se reducen solas para que la web cargue rápido. |
| Abre la página web. | Las destacadas salen en la portada, y en **Nuestros trabajos** con filtros por tipo. |
| Toca una foto → **Quiero este estilo**. | Se abre la reserva con ese tipo de servicio ya elegido. |

## 7. Avisos a WhatsApp y al celular

| Haz esto | Deberías ver |
| --- | --- |
| **Ajustes → Avisos a tu WhatsApp**: sigue los pasos de CallMeBot y toca **Probar**. | Te llega «los avisos de citas por WhatsApp están funcionando». |
| Haz una reserva desde la web. | Llega un WhatsApp con la clienta, los servicios, la hora y con quién. |
| **Más → Avisos en este celular → Activar** (con la app instalada). | Al reservar alguien, aparece una notificación en el celular. Requiere las variables VAPID. |

## 8. Fin del día

| Haz esto | Deberías ver |
| --- | --- |
| **Más → Cierre de caja**: escribe el efectivo que hay. | Te dice si la caja cuadra, sobra o falta. |
| **Más → Reportes → Este mes**. | Cobrado, ganancia neta, gráfico por día, cuánto hizo cada una y los servicios más pedidos. |
| **Descargar en Excel (CSV)**. | Archivo con todas las ventas del periodo. |

---

Si algo no se ve como dice esta guía, anota en qué paso fue y qué apareció en pantalla (una captura ayuda mucho).
