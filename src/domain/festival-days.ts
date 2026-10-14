import { festivalDayOf } from "@/domain/time";

/** Day the grid opens on: today's festival day, else the next one, else the last (FR-091). */
export function defaultFestivalDay(days: readonly string[], now: Date): string {
  const today = festivalDayOf(now);
  return days.find((day) => day >= today) ?? days[days.length - 1];
}

const dayFormatter = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
const shortFormatter = new Intl.DateTimeFormat("es-AR", { timeZone: "UTC", weekday: "short", day: "numeric" });

const partsOf = (formatter: Intl.DateTimeFormat, day: string) =>
  Object.fromEntries(formatter.formatToParts(new Date(`${day}T12:00:00Z`)).map((p) => [p.type, p.value]));

/** "sábado 21 de noviembre" */
export function formatFestivalDay(day: string): string {
  const p = partsOf(dayFormatter, day);
  return `${p.weekday} ${p.day} de ${p.month}`;
}

/** "sáb 21" */
export function formatFestivalDayShort(day: string): string {
  const p = partsOf(shortFormatter, day);
  return `${p.weekday.replace(".", "")} ${p.day}`;
}
