import { describe, expect, it } from "vitest";
import { endSession, getSessionUser, requireApiUser } from "@/server/session";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";

withCleanDb();

describe("endSession (AC-10)", () => {
  it("deletes the session so later content requests are denied", async () => {
    const user = await createUser();
    const token = await createSession(user.id);

    await endSession(token);

    expect(await getSessionUser(token)).toBeNull();
    expect((await requireApiUser(requestWithSession("/api/time", token))).response?.status).toBe(401);
  });

  it("is a no-op without a session", async () => {
    await expect(endSession(undefined)).resolves.toBeUndefined();
    await expect(endSession("unknown")).resolves.toBeUndefined();
  });
});
