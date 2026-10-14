import { describe, expect, it } from "vitest";
import { db } from "@/server/db";
import { getSessionUser, requireApiUser, SESSION_MAX_AGE_MS } from "@/server/session";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";

withCleanDb();

const DAY_MS = 24 * 60 * 60 * 1000;

describe("getSessionUser", () => {
  it("returns null without a session token or with an unknown one", async () => {
    expect(await getSessionUser(undefined)).toBeNull();
    expect(await getSessionUser("not-a-session")).toBeNull();
  });

  it("returns null for an expired session", async () => {
    const user = await createUser();
    const token = await createSession(user.id, new Date(Date.now() - 1000));

    expect(await getSessionUser(token)).toBeNull();
  });

  it("returns the user for a valid session", async () => {
    const user = await createUser();
    const token = await createSession(user.id);

    expect((await getSessionUser(token))?.id).toBe(user.id);
  });

  it("renews the session to 30 days from now when it is used (FR-083)", async () => {
    const now = new Date("2026-11-21T20:00:00Z");
    const user = await createUser();
    const token = await createSession(user.id, new Date(now.getTime() + 2 * DAY_MS));

    await getSessionUser(token, now);

    const session = await db.session.findUniqueOrThrow({ where: { sessionToken: token } });
    expect(SESSION_MAX_AGE_MS).toBe(30 * DAY_MS);
    expect(session.expires.getTime()).toBe(now.getTime() + SESSION_MAX_AGE_MS);
  });
});

describe("requireApiUser", () => {
  it("responds 401 without leaking content when there is no session", async () => {
    const result = await requireApiUser(requestWithSession("/api/time"));

    expect(result.response?.status).toBe(401);
    expect(await result.response?.json()).toEqual({ error: "unauthenticated" });
  });

  it("responds 401 while a Google account has not chosen its username (FR-015)", async () => {
    const user = await createUser(null);
    const token = await createSession(user.id);

    const result = await requireApiUser(requestWithSession("/api/time", token));

    expect(result.response?.status).toBe(401);
  });

  it("returns the user for a valid session with username", async () => {
    const user = await createUser("ana");
    const token = await createSession(user.id);

    const result = await requireApiUser(requestWithSession("/api/time", token));

    expect(result.user?.id).toBe(user.id);
    expect(result.response).toBeUndefined();
  });
});
