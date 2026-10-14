import { describe, expect, it } from "vitest";
import { findOverlaps } from "@/domain/overlap";

const at = (hhmm: string) => new Date(`2026-11-21T${hhmm}:00Z`);
const show = (id: string, start: string, end: string) => ({ id, artist: `Artista ${id}`, startsAt: at(start), endsAt: at(end) });

describe("findOverlaps", () => {
  it("reports two selected shows whose intervals overlap, naming both (AC-41)", () => {
    expect(findOverlaps([show("a", "18:00", "19:00"), show("b", "18:30", "19:30")])).toEqual([
      { first: { id: "a", artist: "Artista a" }, second: { id: "b", artist: "Artista b" } },
    ]);
  });

  it("does not report contiguous shows (AC-42)", () => {
    expect(findOverlaps([show("a", "18:00", "19:00"), show("b", "19:00", "20:00")])).toEqual([]);
  });

  it("reports a show contained in another and every overlapping pair once", () => {
    const overlaps = findOverlaps([show("a", "18:00", "21:00"), show("b", "19:00", "19:30"), show("c", "20:30", "22:00")]);

    expect(overlaps.map((o) => `${o.first.id}-${o.second.id}`)).toEqual(["a-b", "a-c"]);
  });

  it("lists the ids involved in any overlap", async () => {
    const { overlappingIds } = await import("@/domain/overlap");

    expect([...overlappingIds([show("a", "18:00", "19:00"), show("b", "18:30", "19:30"), show("c", "21:00", "22:00")])].sort()).toEqual(["a", "b"]);
  });
});
