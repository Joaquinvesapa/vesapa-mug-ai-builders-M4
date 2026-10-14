import { describe, expect, it } from "vitest";
import { GET as getShowDetail } from "@/app/api/shows/[id]/route";
import { listShowsForDay, listStages } from "@/server/lineup";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";
import { FIXTURE_DAYS, importFixture } from "../support/lineup";

withCleanDb();

describe("line-up queries", () => {
  it("shows every show exactly once across the festival days (AC-31)", async () => {
    await importFixture();

    const ids = (await Promise.all(FIXTURE_DAYS.map(listShowsForDay))).flat().map((s) => s.id);

    expect(ids.sort()).toEqual(["s1", "s2", "s3", "s4", "s5"]);
  });

  it("returns only the shows of the requested day, ordered by start (AC-32)", async () => {
    await importFixture();

    expect((await listShowsForDay("2026-11-21")).map((s) => s.id)).toEqual(["s1", "s2", "s3", "s4"]);
    expect((await listShowsForDay("2026-11-22")).map((s) => s.id)).toEqual(["s5"]);
  });

  it("keeps an after-midnight show on its festival day (AC-04)", async () => {
    await importFixture();

    expect((await listShowsForDay("2026-11-21")).map((s) => s.id)).toContain("s4");
  });

  it("lists stages by order of appearance", async () => {
    await importFixture();

    expect((await listStages()).map((s) => s.name)).toEqual(["Norte", "Sur", "Carpa"]);
  });
});

describe("GET /api/shows/[id]", () => {
  const call = (id: string, token?: string) =>
    getShowDetail(requestWithSession(`/api/shows/${id}`, token), { params: Promise.resolve({ id }) });

  it("returns the full detail of a show (AC-35)", async () => {
    await importFixture();
    const user = await createUser();
    const token = await createSession(user.id);

    const response = await call("s4", token);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "s4",
      artist: "Noche Larga",
      description: "Techno",
      day: "2026-11-21",
      stage: "Carpa",
      startsAt: "2026-11-22T03:30:00.000Z",
      endsAt: "2026-11-22T04:30:00.000Z",
    });
  });

  it("responds 404 for an unknown show", async () => {
    const user = await createUser();
    const token = await createSession(user.id);

    expect((await call("nope", token)).status).toBe(404);
  });
});
