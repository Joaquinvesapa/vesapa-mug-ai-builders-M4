import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { getMyGroup } from "@/server/groups/group-service";
import { acceptInvitation, invite } from "@/server/groups/invitation-service";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";
import { groupWith, T0 } from "../support/groups";

withCleanDb();

const names = (n: number) => Array.from({ length: n }, (_, i) => `m${String(i).padStart(2, "0")}`);

describe("group limit under concurrency (FR-051)", () => {
  it("creates only one of two simultaneous invitations for the last slot", async () => {
    const { owner } = await groupWith("ana", names(13));
    await createUser("equis1");
    await createUser("equis2");

    const results = await Promise.all([invite(owner.id, "equis1", T0), invite(owner.id, "equis2", T0)]);

    expect(results.map((r) => r.status).sort()).toEqual(["group_full", "ok"]);
    expect(await db.invitation.count({ where: { status: "PENDING" } })).toBe(1);
  });

  it("lets a person join only one group when accepting two invitations at once", async () => {
    const g1 = await groupWith("ana");
    const g2 = await groupWith("caro");
    const beto = await createUser("beto");
    const a = await invite(g1.owner.id, "beto", T0);
    const b = await invite(g2.owner.id, "beto", T0);
    if (a.status !== "ok" || b.status !== "ok") throw new Error("invite failed");

    const results = await Promise.all([
      acceptInvitation(beto.id, a.invitationId, T0),
      acceptInvitation(beto.id, b.invitationId, T0),
    ]);

    expect(results.filter((r) => r.status === "ok")).toHaveLength(1);
    expect(await db.membership.count({ where: { userId: beto.id } })).toBe(1);
    expect(await getMyGroup(beto.id)).not.toBeNull();
  });

  it("never exceeds 15 members with simultaneous invitations and acceptances", async () => {
    const { owner } = await groupWith("ana", names(12));
    const people = await Promise.all(["ye1", "ye2", "ye3", "ye4"].map((n) => createUser(n)));

    const sent = await Promise.all(people.map((p) => invite(owner.id, p.username!, T0)));
    await Promise.all(
      sent.map((s, i) => (s.status === "ok" ? acceptInvitation(people[i].id, s.invitationId, T0) : null)),
    );

    expect(sent.filter((s) => s.status === "ok")).toHaveLength(2);
    expect((await getMyGroup(owner.id))!.members).toHaveLength(15);
  });
});
