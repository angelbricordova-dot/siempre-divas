"use client";

/** Descarga un archivo .ics para guardar la cita en el calendario del celular. */
export function AddToCalendar({ title, start, end, location }: { title: string; start: string; end: string; location: string }) {
  function download() {
    const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Siempre Divas//Reservas//ES",
      "BEGIN:VEVENT",
      `UID:${fmt(start)}-siempredivas`,
      `DTSTAMP:${fmt(new Date().toISOString())}`,
      `DTSTART:${fmt(start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${title}`,
      `LOCATION:${location}`,
      "BEGIN:VALARM",
      "TRIGGER:-PT2H",
      "ACTION:DISPLAY",
      "DESCRIPTION:Tu cita en Siempre Divas",
      "END:VALARM",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cita-siempre-divas.ics";
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" onClick={download} className="btn btn-ghost">
      Guardar en mi calendario
    </button>
  );
}
