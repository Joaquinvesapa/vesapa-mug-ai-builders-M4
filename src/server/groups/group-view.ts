import { aggregateMatches, listMatches, type MatchRow } from "@/domain/group-matches";
import { db } from "@/server/db";

export type GroupView = { groupId: string; groupName: string; day: string; shows: MatchRow[] };

/**
 * Selections of the actor's group for one festival day. Only members get a view (AC-79);
 * names of shows chosen by fewer than 2 members never leave the server (FR-061).
 */
export async function getGroupView(actorId: string, day: string): Promise<GroupView | null> {
  const membership = await db.membership.findUnique({ where: { userId: actorId }, include: { group: true } });
  if (!membership) return null;

  const festivalDay = new Date(`${day}T00:00:00Z`);
  const [selections, shows] = await Promise.all([
    db.selection.findMany({
      where: { show: { festivalDay }, user: { membership: { groupId: membership.groupId } } },
      select: { showId: true, userId: true, user: { select: { username: true } } },
    }),
    db.show.findMany({ where: { festivalDay }, select: { id: true, artist: true, startsAt: true } }),
  ]);

  const rows = aggregateMatches(
    selections.map((s) => ({ showId: s.showId, userId: s.userId, username: s.user.username! })),
    actorId,
  );
  return {
    groupId: membership.groupId,
    groupName: membership.group.name,
    day,
    shows: listMatches(rows, shows, { by: "time", onlyMatches: false }),
  };
}
