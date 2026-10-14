import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { PERF_DAYS, seedPerformanceFixture } from "../../fixtures/perf/seed";
import { withCleanDb } from "../setup/db";

withCleanDb();

describe("performance fixture (RNF-01, RNF-03)", () => {
  it("loads 150 shows and a group of 15 members with 30 selections each", async () => {
    const fixture = await seedPerformanceFixture();

    expect(await db.show.count()).toBe(150);
    expect(await db.stage.count()).toBe(5);
    expect(await db.membership.count({ where: { groupId: fixture.groupId } })).toBe(15);
    expect(fixture.members).toHaveLength(15);
    for (const member of fixture.members) {
      expect(await db.selection.count({ where: { userId: member.id } })).toBe(30);
    }
  });

  it("spreads shows over every festival day and is deterministic", async () => {
    const first = await seedPerformanceFixture();
    const firstSelections = await db.selection.findMany({ orderBy: [{ userId: "asc" }, { showId: "asc" }], select: { showId: true } });

    for (const day of PERF_DAYS) {
      expect(await db.show.count({ where: { festivalDay: new Date(`${day}T00:00:00Z`) } })).toBe(50);
    }
    expect(first.members.map((m) => m.username)).toEqual(Array.from({ length: 15 }, (_, i) => `perf${String(i + 1).padStart(2, "0")}`));
    expect(new Set(firstSelections.map((s) => s.showId)).size).toBeGreaterThan(30);
  });
});
