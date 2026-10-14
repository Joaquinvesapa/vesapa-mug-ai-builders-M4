import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/users/route";
import { db } from "@/server/db";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";

withCleanDb();

const search = async (q: string, token: string) => GET(requestWithSession(`/api/users?q=${encodeURIComponent(q)}`, token));

describe("GET /api/users", () => {
  it("matches usernames by prefix ignoring case (AC-27, FR-022)", async () => {
    const me = await createUser("yo_mismo");
    for (const name of ["Ana", "anabel", "Mariana", "beto"]) await createUser(name);

    const body = await (await search("AN", await createSession(me.id))).json();

    expect(body.map((u: { username: string }) => u.username)).toEqual(["Ana", "anabel"]);
  });

  it("exposes exactly username and avatar (AC-28, FR-022)", async () => {
    const me = await createUser("yo_mismo");
    await createUser("ana");

    const [result] = await (await search("an", await createSession(me.id))).json();

    expect(Object.keys(result).sort()).toEqual(["avatar", "username"]);
    expect(Object.keys(result.avatar).sort()).toEqual(["color", "shape"]);
  });

  it("excludes the person searching", async () => {
    const me = await createUser("ana");
    await createUser("anabel");

    const body = await (await search("ana", await createSession(me.id))).json();

    expect(body.map((u: { username: string }) => u.username)).toEqual(["anabel"]);
  });

  it("returns at most 10 results", async () => {
    const me = await createUser("yo_mismo");
    for (let i = 0; i < 12; i++) await createUser(`user${String(i).padStart(2, "0")}`);

    expect(await (await search("us", await createSession(me.id))).json()).toHaveLength(10);
  });

  it("treats underscore and dot literally, not as wildcards", async () => {
    const me = await createUser("yo_mismo");
    await createUser("ab_c");
    await createUser("abxc");

    const body = await (await search("ab_", await createSession(me.id))).json();

    expect(body.map((u: { username: string }) => u.username)).toEqual(["ab_c"]);
  });

  it("ignores accounts still choosing their username", async () => {
    const me = await createUser("yo_mismo");
    await db.user.create({ data: { avatarShape: "circle", avatarColor: "violet" } });
    await createUser("ana");

    expect(await (await search("an", await createSession(me.id))).json()).toHaveLength(1);
  });

  it.each(["", "a", " a "])("rejects a query shorter than 2 characters: %j", async (q) => {
    const me = await createUser("yo_mismo");

    expect((await search(q, await createSession(me.id))).status).toBe(400);
  });
});
