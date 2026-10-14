export type ShowStatus = "upcoming" | "live" | "finished";

export const STATUS_LABELS: Record<ShowStatus, string> = {
  upcoming: "próximo",
  live: "en vivo",
  finished: "finalizado",
};

/** Upcoming before the start, live from the start until before the end, finished from the end (FR-043). */
export function showStatus(startsAt: Date, endsAt: Date, now: Date): ShowStatus {
  if (now.getTime() < startsAt.getTime()) return "upcoming";
  if (now.getTime() < endsAt.getTime()) return "live";
  return "finished";
}

/** Authoritative instant: device clock corrected by the offset measured against the server. */
export function serverNow(offsetMs: number, deviceNow: Date = new Date()): Date {
  return new Date(deviceNow.getTime() + offsetMs);
}
