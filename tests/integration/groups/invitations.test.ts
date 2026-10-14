import { describe, expect, it } from "vitest";
import { getMyGroup } from "@/server/groups/group-service";
import {
  acceptInvitation,
  cancelInvitation,
  invite,
  listReceivedInvitations,
  rejectInvitation,
} from "@/server/groups/invitation-service";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";
import { after, groupWith, MINUTE, T0 } from "../support/groups";

withCleanDb();

const names = (n: number, prefix = "m") => Array.from({ length: n }, (_, i) => `${prefix}${String(i).padStart(2, "0")}`);

describe("invitations", () => {
  it("invites a registered user by username, who sees it in the app (AC-50, AC-54)", async () => {
    const { owner } = await groupWith("ana");
    const beto = await createUser("beto");

    const sent = await invite(owner.id, "BETO", T0);

    expect(sent.status).toBe("ok");
    expect(await listReceivedInvitations(beto.id, T0)).toEqual([
      { id: sent.status === "ok" ? sent.invitationId : "", groupName: "Grupo de ana", ownerUsername: "ana", expiresAt: after(15 * MINUTE) },
    ]);
  });

  it("rejects inviting an unknown username", async () => {
    const { owner } = await groupWith("ana");

    expect(await invite(owner.id, "nadie", T0)).toEqual({ status: "user_not_found" });
  });

  it("rejects inviting someone who already belongs to a group (AC-53)", async () => {
    const { owner } = await groupWith("ana");
    await groupWith("beto");

    expect(await invite(owner.id, "beto", T0)).toEqual({ status: "user_in_group" });
  });

  it("accepts at 14:59 and rejects at 15:00 (AC-55, AC-56, AC-59)", async () => {
    const { owner } = await groupWith("ana");
    const beto = await createUser("beto");
    const caro = await createUser("caro");
    const toBeto = await invite(owner.id, "beto", T0);
    const toCaro = await invite(owner.id, "caro", T0);
    if (toBeto.status !== "ok" || toCaro.status !== "ok") throw new Error("invite failed");

    expect(await acceptInvitation(beto.id, toBeto.invitationId, after(15 * MINUTE - 1000))).toEqual({ status: "ok" });
    expect(await acceptInvitation(caro.id, toCaro.invitationId, after(15 * MINUTE))).toEqual({ status: "expired" });
    expect(await listReceivedInvitations(caro.id, after(15 * MINUTE))).toEqual([]);
    expect((await getMyGroup(owner.id))!.members.map((m) => m.username)).toEqual(["ana", "beto"]);
  });

  it("lets the invitee reject, without joining (AC-60)", async () => {
    const { owner } = await groupWith("ana");
    const beto = await createUser("beto");
    const sent = await invite(owner.id, "beto", T0);
    if (sent.status !== "ok") throw new Error("invite failed");

    expect(await rejectInvitation(beto.id, sent.invitationId, T0)).toEqual({ status: "ok" });

    expect(await listReceivedInvitations(beto.id, T0)).toEqual([]);
    expect(await acceptInvitation(beto.id, sent.invitationId, T0)).toEqual({ status: "not_found" });
    expect(await getMyGroup(beto.id)).toBeNull();
  });

  it("reaches 15 members by accepting with 14 members and no pending invitations (AC-45)", async () => {
    const { owner } = await groupWith("ana", names(13));
    const last = await createUser("ultimo");
    const sent = await invite(owner.id, "ultimo", T0);
    if (sent.status !== "ok") throw new Error(sent.status);

    expect(await acceptInvitation(last.id, sent.invitationId, T0)).toEqual({ status: "ok" });
    expect((await getMyGroup(owner.id))!.members).toHaveLength(15);
  });

  it("does not invite with 15 members (AC-46)", async () => {
    const { owner } = await groupWith("ana", names(14));
    await createUser("extra");

    expect(await invite(owner.id, "extra", T0)).toEqual({ status: "group_full" });
  });

  it("counts pending invitations in the limit and frees expired ones (AC-57, AC-58)", async () => {
    const { owner } = await groupWith("ana", names(13));
    await createUser("pendiente");
    await createUser("otro");
    await invite(owner.id, "pendiente", T0);

    expect(await invite(owner.id, "otro", after(MINUTE))).toEqual({ status: "group_full" });
    expect((await invite(owner.id, "otro", after(15 * MINUTE))).status).toBe("ok");
  });

  it("cancelling frees the slot and hides the invitation from the invitee (FR-057, AC-111)", async () => {
    const { owner } = await groupWith("ana", names(13));
    const pend = await createUser("pendiente");
    await createUser("otro");
    const sent = await invite(owner.id, "pendiente", T0);
    if (sent.status !== "ok") throw new Error(sent.status);

    expect(await cancelInvitation(owner.id, sent.invitationId, T0)).toEqual({ status: "ok" });

    expect(await listReceivedInvitations(pend.id, T0)).toEqual([]);
    expect(await acceptInvitation(pend.id, sent.invitationId, T0)).toEqual({ status: "not_found" });
    expect((await invite(owner.id, "otro", T0)).status).toBe("ok");
  });

  it("cannot cancel an invitation that is no longer pending", async () => {
    const { owner } = await groupWith("ana");
    await createUser("beto");
    const sent = await invite(owner.id, "beto", T0);
    if (sent.status !== "ok") throw new Error(sent.status);

    expect(await cancelInvitation(owner.id, sent.invitationId, after(15 * MINUTE))).toEqual({ status: "not_pending" });
  });

  it("shows the owner the pending invitations with invitee, status and expiry (FR-057)", async () => {
    const { owner } = await groupWith("ana");
    await createUser("beto");
    await invite(owner.id, "beto", T0);

    const group = await getMyGroup(owner.id, after(MINUTE));

    expect(group!.pendingInvitations).toEqual([
      { id: expect.any(String), inviteeUsername: "beto", status: "pendiente", expiresAt: after(15 * MINUTE) },
    ]);
  });

  it("rejects a duplicated pending invitation to the same person", async () => {
    const { owner } = await groupWith("ana");
    await createUser("beto");
    await invite(owner.id, "beto", T0);

    expect(await invite(owner.id, "beto", after(MINUTE))).toEqual({ status: "already_invited" });
    expect((await invite(owner.id, "beto", after(15 * MINUTE))).status).toBe("ok");
  });

  it("allows invitations from several groups; accepting one invalidates the others and frees their slot (FR-053)", async () => {
    const g1 = await groupWith("ana");
    const g2 = await groupWith("caro", names(13, "c"));
    const beto = await createUser("beto");
    await createUser("dani");
    const from1 = await invite(g1.owner.id, "beto", T0);
    const from2 = await invite(g2.owner.id, "beto", T0);
    if (from1.status !== "ok" || from2.status !== "ok") throw new Error("invite failed");
    expect(await listReceivedInvitations(beto.id, T0)).toHaveLength(2);

    expect(await acceptInvitation(beto.id, from1.invitationId, T0)).toEqual({ status: "ok" });

    expect(await listReceivedInvitations(beto.id, T0)).toEqual([]);
    expect(await acceptInvitation(beto.id, from2.invitationId, T0)).toEqual({ status: "not_found" });
    expect((await invite(g2.owner.id, "dani", T0)).status).toBe("ok");
  });
});
