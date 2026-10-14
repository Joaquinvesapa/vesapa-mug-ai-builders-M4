import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import {
  createGroup,
  deleteGroup,
  getMyGroup,
  leaveGroup,
  removeMember,
  renameGroup,
  transferOwnership,
} from "@/server/groups/group-service";
import { invite, listReceivedInvitations } from "@/server/groups/invitation-service";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";
import { groupWith, T0 } from "../support/groups";

withCleanDb();

describe("group lifecycle", () => {
  it("creates a private group with the creator as owner and member (AC-44)", async () => {
    const ana = await createUser("ana");

    const result = await createGroup(ana.id, "Los del sur");

    expect(result.status).toBe("ok");
    const group = await getMyGroup(ana.id);
    expect(group).toMatchObject({ name: "Los del sur", isOwner: true });
    expect(group!.members.map((m) => [m.username, m.isOwner])).toEqual([["ana", true]]);
  });

  it.each(["", "   ", "x".repeat(41)])("rejects the group name %j (FR-050)", async (name) => {
    const ana = await createUser("ana");

    expect(await createGroup(ana.id, name)).toEqual({ status: "invalid_name" });
  });

  it("accepts names of 1 and 40 characters, trimmed", async () => {
    const ana = await createUser("ana");
    const beto = await createUser("beto");

    expect((await createGroup(ana.id, " A ")).status).toBe("ok");
    expect((await getMyGroup(ana.id))!.name).toBe("A");
    expect((await createGroup(beto.id, "x".repeat(40))).status).toBe("ok");
  });

  it("does not let a person with a group create another (AC-47)", async () => {
    const { owner, members } = await groupWith("ana", ["beto"]);

    expect(await createGroup(owner.id, "Otro")).toEqual({ status: "already_in_group" });
    expect(await createGroup(members[0].id, "Otro")).toEqual({ status: "already_in_group" });
  });

  it("invalidates the creator's pending invitations from other groups when creating a group", async () => {
    const { owner } = await groupWith("ana");
    const caro = await createUser("caro");
    await invite(owner.id, "caro", T0);

    await createGroup(caro.id, "Propio");

    expect(await listReceivedInvitations(caro.id, T0)).toEqual([]);
  });

  it("renames the group (AC-48)", async () => {
    const { owner } = await groupWith("ana");

    expect(await renameGroup(owner.id, "Nuevo nombre")).toEqual({ status: "ok" });
    expect((await getMyGroup(owner.id))!.name).toBe("Nuevo nombre");
  });

  it("transfers ownership to a member (AC-64)", async () => {
    const { owner, members } = await groupWith("ana", ["beto"]);

    expect(await transferOwnership(owner.id, members[0].id)).toEqual({ status: "ok" });

    expect((await getMyGroup(members[0].id))!.isOwner).toBe(true);
    expect((await getMyGroup(owner.id))!.isOwner).toBe(false);
  });

  it("does not transfer ownership to a non-member", async () => {
    const { owner } = await groupWith("ana");
    const outsider = await createUser("zoe");

    expect(await transferOwnership(owner.id, outsider.id)).toEqual({ status: "not_member" });
  });

  it("lets a non-owner member leave and lose access (AC-61)", async () => {
    const { owner, members } = await groupWith("ana", ["beto"]);

    expect(await leaveGroup(members[0].id)).toEqual({ status: "ok" });

    expect(await getMyGroup(members[0].id)).toBeNull();
    expect((await getMyGroup(owner.id))!.members.map((m) => m.username)).toEqual(["ana"]);
  });

  it("does not let the owner leave, even as the only member (AC-66, FR-050)", async () => {
    const solo = await groupWith("ana");
    const withMembers = await groupWith("caro", ["dani"]);

    expect(await leaveGroup(solo.owner.id)).toEqual({ status: "owner_cannot_leave" });
    expect(await leaveGroup(withMembers.owner.id)).toEqual({ status: "owner_cannot_leave" });
  });

  it("lets the owner remove a member (AC-62)", async () => {
    const { owner, members } = await groupWith("ana", ["beto", "caro"]);

    expect(await removeMember(owner.id, members[0].id)).toEqual({ status: "ok" });

    expect(await getMyGroup(members[0].id)).toBeNull();
    expect((await getMyGroup(owner.id))!.members.map((m) => m.username)).toEqual(["ana", "caro"]);
  });

  it("deletes the group: everyone loses access and pending invitations disappear (AC-67, FR-056)", async () => {
    const { owner, members } = await groupWith("ana", ["beto"]);
    const caro = await createUser("caro");
    await invite(owner.id, "caro", T0);

    expect(await deleteGroup(owner.id)).toEqual({ status: "ok" });

    expect(await getMyGroup(owner.id)).toBeNull();
    expect(await getMyGroup(members[0].id)).toBeNull();
    expect(await listReceivedInvitations(caro.id, T0)).toEqual([]);
    expect(await db.group.count()).toBe(0);
  });
});
