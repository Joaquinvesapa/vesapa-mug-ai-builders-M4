export const FESTIVAL_TIME_ZONE = "America/Argentina/Buenos_Aires";

/** Argentina has used a fixed UTC-3 offset with no daylight saving since 2009. */
const UTC_OFFSET_HOURS = -3;

/** A festival day runs from 06:00 local time until 05:59 of the next calendar day. */
export const DAY_START_HOUR = 6;

const DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const HOUR_MS = 60 * 60 * 1000;

function parseDay(day: string): [number, number, number] {
  const match = DAY_PATTERN.exec(day);
  if (!match) throw new Error(`Invalid festival day: ${day}`);
  const [year, month, date] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const probe = new Date(Date.UTC(year, month - 1, date));
  if (probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== date) {
    throw new Error(`Invalid festival day: ${day}`);
  }
  return [year, month, date];
}

/** Converts a festival day (YYYY-MM-DD) and local time (HH:MM) into its UTC instant. */
export function festivalTimeToInstant(day: string, time: string): Date {
  const [year, month, date] = parseDay(day);
  const match = TIME_PATTERN.exec(time);
  if (!match) throw new Error(`Invalid festival time: ${time}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const calendarDate = hours < DAY_START_HOUR ? date + 1 : date;
  return new Date(Date.UTC(year, month - 1, calendarDate, hours - UTC_OFFSET_HOURS, minutes));
}

const timeFormatter = new Intl.DateTimeFormat("es-AR", {
  timeZone: FESTIVAL_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Formats an instant as HH:MM in festival local time. */
export function formatFestivalTime(instant: Date): string {
  return timeFormatter.format(instant);
}

/** Returns the festival day (YYYY-MM-DD) an instant belongs to. */
export function festivalDayOf(instant: Date): string {
  const shifted = new Date(instant.getTime() + (UTC_OFFSET_HOURS - DAY_START_HOUR) * HOUR_MS);
  return shifted.toISOString().slice(0, 10);
}
