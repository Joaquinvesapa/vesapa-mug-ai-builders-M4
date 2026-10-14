import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/group/view/route";
import { getGroupView } from "@/server/groups/group-view";
import { removeMember } from "@/server/groups/group-service";
import { setSelection } from "@/server/selection";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";
import { groupWith } from "../support/groups";
import { importFixture } from "../support/lineup";

withCleanDb();

const DAY = "2026-11-21";

async function setup() {
  await importFixture();
  const group = await groupWith("ana", ["beto", "caro"]);
  const [beto, caro] = group.members;
  return { ...group, ana: group.owner, beto, caro };
}

describe("getGroupView", () => {
  it("counts members per show, names only matches, and flags my shows (AC-70 to AC-74)", async () => {
    const { ana, beto, caro } = await setup();
    for (const user of [ana, beto, caro]) await setSelection(user.id, "s1", true);
    await setSelection(beto.id, "s2", true);
    await setSelection(caro.id, "s2", true);
    await setSelection(caro.id, "s3", true);

    const view = await getGroupView(ana.id, DAY);

    expect(view!.shows).toEqual([
      { showId: "s1", count: 3, isMatch: true, usernames: ["ana", "beto", "caro"], selectedByMe: true },
      { showId: "s2", count: 2, isMatch: true, usernames: ["beto", "caro"], selectedByMe: false },
      { showId: "s3", count: 1, isMatch: false, usernames: [], selectedByMe: false },
    ]);
  });

  it("ignores selections of people outside the group and of other days", async () => {
    const { ana } = await setup();
    const outsider = await createUser("zoe");
    await setSelection(outsider.id, "s1", true);
    await setSelection(ana.id, "s5", true);

    expect((await getGroupView(ana.id, DAY))!.shows).toEqual([]);
  });

  it("reflects a member's change on the next query (AC-78)", async () => {
    const { ana, beto } = await setup();
    await setSelection(beto.id, "s1", true);
    expect((await getGroupView(ana.id, DAY))!.shows[0].count).toBe(1);

    await setSelection(ana.id, "s1", true);
    expect((await getGroupView(ana.id, DAY))!.shows[0].count).toBe(2);

    await setSelection(beto.id, "s1", false);
    expect((await getGroupView(ana.id, DAY))!.shows[0].count).toBe(1);
  });

  it("is null for someone outside every group and for a removed member (AC-79, FR-094)", async () => {
    const { ana, beto } = await setup();
    const zoe = await createUser("zoe");
    await removeMember(ana.id, beto.id);

    expect(await getGroupView(zoe.id, DAY)).toBeNull();
    expect(await getGroupView(beto.id, DAY)).toBeNull();
  });
});

describe("GET /api/group/view", () => {
  const call = (token: string | undefined, day = DAY) => GET(requestWithSession(`/api/group/view?day=${day}`, token));

  it("serves the view to a member", async () => {
    const { ana, beto } = await setup();
    await setSelection(ana.id, "s1", true);
    await setSelection(beto.id, "s1", true);

    const response = await call(await createSession(ana.id));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      day: DAY,
      shows: [{ showId: "s1", count: 2, isMatch: true, usernames: ["ana", "beto"], selectedByMe: true }],
    });
  });

  it("never sends names for shows chosen by fewer than 2 members", async () => {
    const { ana } = await setup();
    await setSelection(ana.id, "s1", true);

    const body = await (await call(await createSession(ana.id))).json();

    expect(body.shows[0].usernames).toEqual([]);
    expect(JSON.stringify(body)).not.toContain("ana");
  });

  it("answers 404 without counts or names to someone outside the group (AC-79)", async () => {
    const { ana } = await setup();
    await setSelection(ana.id, "s1", true);
    const zoe = await createUser("zoe");

    const response = await call(await createSession(zoe.id));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  it("rejects a day that is not a festival day", async () => {
    const { ana } = await setup();

    expect((await call(await createSession(ana.id), "2030-01-01")).status).toBe(400);
  });
});
