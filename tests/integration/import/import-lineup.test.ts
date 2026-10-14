import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { importLineup, LineupImportError } from "@/server/lineup-import";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";

withCleanDb();

const DAYS = ["2026-11-21", "2026-11-22"];
const fixture = (name: string) => readFileSync(`tests/fixtures/lineup/${name}`, "utf8");

async function snapshot() {
  const shows = await db.show.findMany({ orderBy: { id: "asc" }, include: { stage: true } });
  return shows.map((s) => ({ id: s.id, description: s.description, startsAt: s.startsAt, stage: s.stage.name, position: s.stage.position }));
}

describe("importLineup", () => {
  it("loads every show of a valid CSV with stages in order of appearance (AC-01)", async () => {
    const result = await importLineup(fixture("valid.csv"), { festivalDays: DAYS });

    expect(result).toEqual({ created: 5, updated: 0, deleted: 0 });
    expect(await db.show.count()).toBe(5);
    const stages = await db.stage.findMany({ orderBy: { position: "asc" } });
    expect(stages.map((s) => s.name)).toEqual(["Norte", "Sur", "Carpa"]);
  });

  it.each([["missing-stage.csv"], ["six-stages.csv"]])("rejects %s leaving 0 shows (AC-03, AC-109)", async (file) => {
    await expect(importLineup(fixture(file), { festivalDays: DAYS })).rejects.toBeInstanceOf(LineupImportError);

    expect(await db.show.count()).toBe(0);
    expect(await db.stage.count()).toBe(0);
  });

  it("leaves an existing line-up untouched when a new import is invalid", async () => {
    await importLineup(fixture("valid.csv"), { festivalDays: DAYS });
    const before = await snapshot();

    await expect(importLineup(fixture("missing-stage.csv"), { festivalDays: DAYS })).rejects.toThrow();

    expect(await snapshot()).toEqual(before);
  });

  it("rejects a reimport that omits existing shows, listing them, without changes (FR-006)", async () => {
    await importLineup(fixture("valid.csv"), { festivalDays: DAYS });
    const before = await snapshot();

    const error = await importLineup(fixture("updated-without-s3.csv"), { festivalDays: DAYS }).catch((e) => e);

    expect(error).toBeInstanceOf(LineupImportError);
    expect(error.missingShowIds).toEqual(["s3"]);
    expect(await snapshot()).toEqual(before);
  });

  it("with explicit deletion, removes missing shows and their selections and keeps stable ids (FR-006)", async () => {
    await importLineup(fixture("valid.csv"), { festivalDays: DAYS });
    const user = await createUser();
    await db.selection.createMany({ data: [{ userId: user.id, showId: "s1" }, { userId: user.id, showId: "s3" }] });

    const result = await importLineup(fixture("updated-without-s3.csv"), { festivalDays: DAYS, allowDeletions: true });

    expect(result).toEqual({ created: 0, updated: 4, deleted: 1 });
    expect(await db.show.findUnique({ where: { id: "s3" } })).toBeNull();
    const selections = await db.selection.findMany({ where: { userId: user.id } });
    expect(selections.map((s) => s.showId)).toEqual(["s1"]);
    const s1 = await db.show.findUniqueOrThrow({ where: { id: "s1" } });
    expect(s1.description).toBe("Rock de la costa (nuevo horario)");
    expect(s1.startsAt).toEqual(new Date("2026-11-21T21:15:00Z"));
  });

  it("reorders stages when their order of appearance changes", async () => {
    await importLineup(fixture("valid.csv"), { festivalDays: DAYS });

    await importLineup(fixture("updated-without-s3.csv"), { festivalDays: DAYS, allowDeletions: true });

    const stages = await db.stage.findMany({ orderBy: { position: "asc" } });
    expect(stages.map((s) => s.name)).toEqual(["Sur", "Norte", "Carpa"]);
  });
});
