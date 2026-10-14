export type MemberSelection = { showId: string; userId: string; username: string };
export type MatchRow = { showId: string; count: number; isMatch: boolean; usernames: string[]; selectedByMe: boolean };

export const MATCH_MIN = 2;

/** Per-show count of members; names only when at least 2 chose it (FR-060, FR-061). */
export function aggregateMatches(selections: readonly MemberSelection[], viewerId: string): MatchRow[] {
  const byShow = Map.groupBy(selections, (s) => s.showId);
  return [...byShow.entries()].map(([showId, rows]) => {
    const count = rows.length;
    const isMatch = count >= MATCH_MIN;
    return {
      showId,
      count,
      isMatch,
      usernames: isMatch ? rows.map((r) => r.username).sort((a, b) => a.localeCompare(b)) : [],
      selectedByMe: rows.some((r) => r.userId === viewerId),
    };
  });
}

export type MatchOrder = { by: "time" | "count"; onlyMatches: boolean };
type OrderableShow = { id: string; artist: string; startsAt: Date };

/** List mode of the group view: order by time or count (ties by start, then artist) and optional filter (FR-062). */
export function listMatches(rows: readonly MatchRow[], shows: readonly OrderableShow[], order: MatchOrder): MatchRow[] {
  const showOf = new Map(shows.map((s) => [s.id, s]));
  const byTime = (a: MatchRow, b: MatchRow) => {
    const sa = showOf.get(a.showId)!;
    const sb = showOf.get(b.showId)!;
    return sa.startsAt.getTime() - sb.startsAt.getTime() || sa.artist.localeCompare(sb.artist);
  };
  return rows
    .filter((row) => showOf.has(row.showId) && (!order.onlyMatches || row.isMatch))
    .sort(order.by === "count" ? (a, b) => b.count - a.count || byTime(a, b) : byTime);
}
