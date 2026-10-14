import { describe, expect, it } from "vitest";
import { authAdapter } from "@/server/auth/adapter";
import { changeUsername } from "@/server/users";
import { requireApiUser } from "@/server/session";
import { withCleanDb } from "../setup/db";
import { createUser, requestWithSession } from "../support/factories";

withCleanDb();

/** Simulates what Auth.js does after a successful Google OAuth callback. */
async function googleSignIn(email = "ana@example.com") {
  const user = await authAdapter.createUser!({ id: "ignored", email, emailVerified: new Date(), name: "Ana", image: null });
  const sessionToken = crypto.randomUUID();
  await authAdapter.createSession!({ sessionToken, userId: user.id, expires: new Date(Date.now() + 86_400_000) });
  return { userId: user.id, sessionToken };
}

describe("Google first access", () => {
  it("signs in but blocks content until a username is chosen (AC-05, AC-11)", async () => {
    const { userId, sessionToken } = await googleSignIn();

    expect((await requireApiUser(requestWithSession("/api/time", sessionToken))).response?.status).toBe(401);

    expect(await changeUsername(userId, "AnaG")).toEqual({ status: "ok" });
    expect((await requireApiUser(requestWithSession("/api/time", sessionToken))).user?.username).toBe("AnaG");
  });

  it("creates the account with a random avatar and without PIN", async () => {
    const { userId } = await googleSignIn();
    const { db } = await import("@/server/db");

    const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.username).toBeNull();
    expect(user.pinHash).toBeNull();
    expect(user.avatarShape).toBeTruthy();
    expect(user.avatarColor).toBeTruthy();
  });

  it("rejects a username taken with different case (AC-14)", async () => {
    await createUser("Ana");
    const { userId } = await googleSignIn();

    expect(await changeUsername(userId, "aNA")).toEqual({ status: "username_taken" });
  });

  it("rejects an invalid username (FR-016)", async () => {
    const { userId } = await googleSignIn();

    expect(await changeUsername(userId, "ana maría")).toEqual({ status: "invalid_username" });
  });
});
