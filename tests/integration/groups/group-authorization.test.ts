import { describe, expect, it } from "vitest";
import {
  deleteGroup,
  getMyGroup,
  removeMember,
  renameGroup,
  transferOwnership,
} from "@/server/groups/group-service";
import {
  acceptInvitation,
  cancelInvitation,
  getInvitation,
  invite,
  rejectInvitation,
} from "@/server/groups/invitation-service";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";
import { groupWith, T0 } from "../support/groups";

withCleanDb();

describe("group permissions", () => {
  it("denies owner actions to a non-owner member (AC-49, AC-52, AC-63, AC-65, AC-68)", async () => {
    const { members, view } = await groupWith("ana", ["beto", "caro"]);
    const [beto, caro] = members;
    await createUser("dani");

    expect(await renameGroup(beto.id, "Tomado")).toEqual({ status: "forbidden" });
    expect(await invite(beto.id, "dani", T0)).toEqual({ status: "forbidden" });
    expect(await removeMember(beto.id, caro.id)).toEqual({ status: "forbidden" });
    expect(await transferOwnership(beto.id, caro.id)).toEqual({ status: "forbidden" });
    expect(await deleteGroup(beto.id)).toEqual({ status: "forbidden" });

    const group = await view();
    expect(group!.name).toBe("Grupo de ana");
    expect(group!.members).toHaveLength(3);
  });

  it("denies a non-owner member cancelling an invitation (AC-112)", async () => {
    const { owner, members } = await groupWith("ana", ["beto"]);
    await createUser("dani");
    const sent = await invite(owner.id, "dani", T0);
    if (sent.status !== "ok") throw new Error(sent.status);

    expect(await cancelInvitation(members[0].id, sent.invitationId, T0)).toEqual({ status: "forbidden" });
  });

  it("gives an outsider no way to read or change a group (AC-102)", async () => {
    const { owner, view } = await groupWith("ana", ["beto"]);
    const zoe = await createUser("zoe");
    const sent = await invite(owner.id, "zoe", T0);
    if (sent.status !== "ok") throw new Error(sent.status);
    await rejectInvitation(zoe.id, sent.invitationId, T0);

    expect(await getMyGroup(zoe.id)).toBeNull();
    expect(await renameGroup(zoe.id, "Hackeado")).toEqual({ status: "forbidden" });
    expect(await deleteGroup(zoe.id)).toEqual({ status: "forbidden" });
    expect(await removeMember(zoe.id, owner.id)).toEqual({ status: "forbidden" });
    expect((await view())!.name).toBe("Grupo de ana");
  });

  it("only the invitee can accept, reject or read an invitation, plus the owner can read it (AC-69, AC-103)", async () => {
    const { owner, members } = await groupWith("ana", ["beto"]);
    const caro = await createUser("caro");
    const zoe = await createUser("zoe");
    const sent = await invite(owner.id, "caro", T0);
    if (sent.status !== "ok") throw new Error(sent.status);

    expect(await acceptInvitation(zoe.id, sent.invitationId, T0)).toEqual({ status: "not_found" });
    expect(await rejectInvitation(zoe.id, sent.invitationId, T0)).toEqual({ status: "not_found" });
    expect(await getInvitation(zoe.id, sent.invitationId, T0)).toBeNull();
    expect(await getInvitation(members[0].id, sent.invitationId, T0)).toBeNull();

    expect(await getInvitation(caro.id, sent.invitationId, T0)).toMatchObject({ groupName: "Grupo de ana" });
    expect(await getInvitation(owner.id, sent.invitationId, T0)).toMatchObject({ groupName: "Grupo de ana" });
  });

  it("hides pending invitations from non-owner members", async () => {
    const { owner, members } = await groupWith("ana", ["beto"]);
    await createUser("caro");
    await invite(owner.id, "caro", T0);

    expect((await getMyGroup(members[0].id, T0))!.pendingInvitations).toEqual([]);
    expect((await getMyGroup(owner.id, T0))!.pendingInvitations).toHaveLength(1);
  });
});
