import { describe, expect, it } from "vitest";
import { authAdapter } from "@/server/auth/adapter";
import { loginWithPin } from "@/server/auth/pin-service";
import { db } from "@/server/db";
import { invite, listReceivedInvitations } from "@/server/groups/invitation-service";
import { getGroupView } from "@/server/groups/group-view";
import { setSelection } from "@/server/selection";
import { changeUsername, getMyProfile, updateAvatar } from "@/server/users";
import { AVATAR_SHAPES } from "@/domain/avatar";
import { AVATAR_COLORS } from "@/domain/palettes";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";
import { groupWith, T0 } from "../support/groups";
import { importFixture } from "../support/lineup";

withCleanDb();

describe("own profile", () => {
  it("reads the full profile of the signed-in person (AC-23, FR-020)", async () => {
    const login = await loginWithPin({ username: "Ana", pin: "482913" });
    if (login.status !== "ok") throw new Error(login.status);

    const profile = await getMyProfile(login.userId);

    expect(profile).toEqual({
      username: "Ana",
      avatarShape: expect.any(String),
      avatarColor: expect.any(String),
      accessMethod: "pin",
    });
  });

  it("reports Google as the access method of a Google account", async () => {
    const user = await authAdapter.createUser!({ id: "x", email: "g@example.com", emailVerified: null, name: "G", image: null });
    await authAdapter.linkAccount!({ userId: user.id, type: "oidc", provider: "google", providerAccountId: "123" });
    await changeUsername(user.id, "gina");

    expect((await getMyProfile(user.id))!.accessMethod).toBe("google");
  });

  it("assigns a random shape and color from the fixed sets to every new account (FR-021)", async () => {
    for (const name of ["uno", "dos", "tres"]) await loginWithPin({ username: name, pin: "482913" });

    for (const user of await db.user.findMany()) {
      expect(AVATAR_SHAPES).toContain(user.avatarShape);
      expect(AVATAR_COLORS.map((c) => c.name)).toContain(user.avatarColor);
    }
  });

  it("changes the username (AC-24)", async () => {
    const ana = await createUser("ana");

    expect(await changeUsername(ana.id, "ana_b")).toEqual({ status: "ok" });
    expect((await getMyProfile(ana.id))!.username).toBe("ana_b");
  });

  it("shows the new username in invitations and in the group view (FR-095)", async () => {
    await importFixture();
    const { owner, members } = await groupWith("ana", ["beto"]);
    await createUser("caro");
    await invite(owner.id, "caro", T0);
    await setSelection(owner.id, "s1", true);
    await setSelection(members[0].id, "s1", true);

    await changeUsername(owner.id, "ana_nueva");

    const caro = await db.user.findUniqueOrThrow({ where: { usernameKey: "caro" } });
    expect((await listReceivedInvitations(caro.id, T0))[0].ownerUsername).toBe("ana_nueva");
    expect((await getGroupView(members[0].id, "2026-11-21"))!.shows[0].usernames).toEqual(["ana_nueva", "beto"]);
  });

  it("changes avatar shape and color (AC-25, AC-26)", async () => {
    const ana = await createUser("ana");

    expect(await updateAvatar(ana.id, { avatarShape: "star" })).toEqual({ status: "ok" });
    expect(await updateAvatar(ana.id, { avatarColor: "emerald" })).toEqual({ status: "ok" });

    expect(await getMyProfile(ana.id)).toMatchObject({ avatarShape: "star", avatarColor: "emerald" });
  });

  it("rejects shapes and colors outside the fixed sets", async () => {
    const ana = await createUser("ana");

    expect(await updateAvatar(ana.id, { avatarShape: "skull" })).toEqual({ status: "invalid_avatar" });
    expect(await updateAvatar(ana.id, { avatarColor: "black" })).toEqual({ status: "invalid_avatar" });
  });

  it("never reads or changes someone else's profile (AC-29, AC-30, FR-023)", async () => {
    const ana = await createUser("ana");
    const beto = await createUser("beto");
    const before = await db.user.findUniqueOrThrow({ where: { id: beto.id } });

    await changeUsername(ana.id, "ana2");
    await updateAvatar(ana.id, { avatarShape: "hexagon", avatarColor: "blue" });

    expect((await getMyProfile(ana.id))!.username).toBe("ana2");
    expect(await db.user.findUniqueOrThrow({ where: { id: beto.id } })).toEqual(before);
  });
});
