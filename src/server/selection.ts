import { db } from "@/server/db";

export type SelectionResult = { status: "ok"; selected: boolean } | { status: "not_found" };

/** Binary, idempotent selection of a show in the person's own grid (FR-040). */
export async function setSelection(userId: string, showId: string, selected: boolean): Promise<SelectionResult> {
  const show = await db.show.findUnique({ where: { id: showId }, select: { id: true } });
  if (!show) return { status: "not_found" };

  if (selected) {
    await db.selection.createMany({ data: [{ userId, showId }], skipDuplicates: true });
  } else {
    await db.selection.deleteMany({ where: { userId, showId } });
  }
  return { status: "ok", selected };
}

/** Ids of the shows a person selected on one festival day; only ever for that person. */
export async function listSelectedShowIds(userId: string, day: string): Promise<string[]> {
  const rows = await db.selection.findMany({
    where: { userId, show: { festivalDay: new Date(`${day}T00:00:00Z`) } },
    select: { showId: true },
    orderBy: { showId: "asc" },
  });
  return rows.map((r) => r.showId);
}
