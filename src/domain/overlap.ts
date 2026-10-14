export type TimedShow = { id: string; artist: string; startsAt: Date; endsAt: Date };
export type Overlap = { first: { id: string; artist: string }; second: { id: string; artist: string } };

const overlaps = (a: TimedShow, b: TimedShow) =>
  a.startsAt.getTime() < b.endsAt.getTime() && b.startsAt.getTime() < a.endsAt.getTime();

/** Pairs of shows whose intervals overlap; contiguous shows do not count (FR-042). */
export function findOverlaps(shows: readonly TimedShow[]): Overlap[] {
  const sorted = [...shows].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime() || a.id.localeCompare(b.id));
  const result: Overlap[] = [];
  sorted.forEach((a, i) => {
    for (const b of sorted.slice(i + 1)) {
      if (overlaps(a, b)) {
        result.push({ first: { id: a.id, artist: a.artist }, second: { id: b.id, artist: b.artist } });
      }
    }
  });
  return result;
}

export function overlappingIds(shows: readonly TimedShow[]): Set<string> {
  return new Set(findOverlaps(shows).flatMap((o) => [o.first.id, o.second.id]));
}
