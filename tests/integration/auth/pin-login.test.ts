import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/auth/pin/route";
import { db } from "@/server/db";
import { getSessionUser, SESSION_COOKIE } from "@/server/session";
import { withCleanDb } from "../setup/db";
import { createUser } from "../support/factories";

withCleanDb();

function login(username: string, pin: string) {
  return POST(
    new Request("http://localhost:3000/api/auth/pin", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, pin }),
    }),
  );
}

function sessionTokenFrom(response: Response) {
  const cookie = response.headers.get("set-cookie") ?? "";
  return new RegExp(`${SESSION_COOKIE}=([^;]+)`).exec(cookie)?.[1];
}

describe("POST /api/auth/pin", () => {
  it("creates the account and signs in when the username does not exist (AC-07)", async () => {
    const response = await login("Ana", "482913");

    expect(response.status).toBe(200);
    const user = await getSessionUser(sessionTokenFrom(response));
    expect(user?.username).toBe("Ana");
    expect(await db.user.count()).toBe(1);
  });

  it("signs into the same account regardless of case (AC-08)", async () => {
    await login("Ana", "482913");

    const response = await login("aNA", "482913");

    expect(response.status).toBe(200);
    expect(await db.user.count()).toBe(1);
    expect((await getSessionUser(sessionTokenFrom(response)))?.username).toBe("Ana");
  });

  it("rejects a wrong PIN without signing in (AC-09)", async () => {
    await login("Ana", "482913");

    const response = await login("Ana", "111111");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid_credentials" });
    expect(sessionTokenFrom(response)).toBeUndefined();
  });

  it.each([
    ["Ana", "48291"],
    ["Ana", "4829130"],
    ["Ana", "48a913"],
    ["an", "482913"],
  ])("rejects malformed credentials %s/%s with 400 (AC-06)", async (username, pin) => {
    const response = await login(username, pin);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_format" });
    expect(await db.user.count()).toBe(0);
  });

  it("stores the PIN only as a hash (AC-20)", async () => {
    await login("Ana", "482913");

    const user = await db.user.findFirstOrThrow();
    expect(user.pinHash).not.toContain("482913");
    expect(user.pinHash).toMatch(/^\$argon2id\$/);
  });

  it("rejects a Google account with any PIN, like a wrong PIN (AC-21)", async () => {
    await createUser("googler");

    const response = await login("googler", "482913");

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "invalid_credentials" });
  });

  it("sets an httpOnly session cookie that expires in 30 days", async () => {
    const response = await login("Ana", "482913");
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toMatch(/SameSite=lax/i);
    expect(cookie).toContain("Path=/");
    expect(cookie).toMatch(/Max-Age=2592000/);
  });
});
