import { db } from "@/server/db";

const asDate = (day: string) => new Date(`${day}T00:00:00Z`);
export const dayOf = (date: Date) => date.toISOString().slice(0, 10);

export function listStages() {
  return db.stage.findMany({ orderBy: { position: "asc" } });
}

/** Shows of one festival day, including those that end after midnight (FR-005). */
export function listShowsForDay(day: string) {
  return db.show.findMany({ where: { festivalDay: asDate(day) }, orderBy: [{ startsAt: "asc" }, { id: "asc" }] });
}

export async function getShowDetail(id: string) {
  const show = await db.show.findUnique({ where: { id }, include: { stage: true } });
  if (!show) return null;
  return {
    id: show.id,
    artist: show.artist,
    description: show.description,
    day: dayOf(show.festivalDay),
    stage: show.stage.name,
    startsAt: show.startsAt.toISOString(),
    endsAt: show.endsAt.toISOString(),
  };
}
