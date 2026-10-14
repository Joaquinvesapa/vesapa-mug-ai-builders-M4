import { describe, expect, it } from "vitest";
import { aggregateMatches, listMatches } from "@/domain/group-matches";

const sel = (showId: string, ...usernames: string[]) => usernames.map((username) => ({ showId, userId: `id-${username}`, username }));

const at = (hhmm: string) => new Date(`2026-11-21T${hhmm}:00Z`);
const SHOWS = [
  { id: "a", artist: "Zeta", startsAt: at("18:00") },
  { id: "b", artist: "Alfa", startsAt: at("19:00") },
  { id: "c", artist: "Beta", startsAt: at("19:00") },
  { id: "d", artist: "Delta", startsAt: at("20:00") },
];

describe("aggregateMatches", () => {
  const rows = aggregateMatches([...sel("a", "caro", "ana", "beto"), ...sel("b", "ana", "beto"), ...sel("d", "caro")], "id-ana");
  const row = (id: string) => rows.find((r) => r.showId === id)!;

  it("counts the members who selected each show (AC-70)", () => {
    expect(row("a").count).toBe(3);
    expect(row("b").count).toBe(2);
    expect(row("d").count).toBe(1);
  });

  it("marks a show chosen by at least 2 members as a match with their names (AC-71, AC-73)", () => {
    expect(row("b")).toMatchObject({ isMatch: true, usernames: ["ana", "beto"] });
    expect(row("a").usernames).toEqual(["ana", "beto", "caro"]);
  });

  it("does not mark or name a show chosen by a single member (AC-72, AC-74)", () => {
    expect(row("d")).toMatchObject({ isMatch: false, usernames: [] });
  });

  it("flags the shows selected by the viewer", () => {
    expect(row("a").selectedByMe).toBe(true);
    expect(row("d").selectedByMe).toBe(false);
  });

  it("omits shows nobody selected", () => {
    expect(rows.find((r) => r.showId === "c")).toBeUndefined();
  });
});

describe("listMatches", () => {
  const rows = aggregateMatches([...sel("a", "ana"), ...sel("b", "ana", "beto"), ...sel("c", "ana", "beto"), ...sel("d", "ana", "beto", "caro")], "id-ana");
  const ids = (by: "time" | "count", onlyMatches = false) => listMatches(rows, SHOWS, { by, onlyMatches }).map((r) => r.showId);

  it("orders by start time ascending, then artist (AC-75)", () => {
    expect(ids("time")).toEqual(["a", "b", "c", "d"]);
  });

  it("orders by count descending, breaking ties by start and then artist (AC-76)", () => {
    expect(ids("count")).toEqual(["d", "b", "c", "a"]);
  });

  it("filters to matches only (AC-77)", () => {
    expect(ids("time", true)).toEqual(["b", "c", "d"]);
  });
});
