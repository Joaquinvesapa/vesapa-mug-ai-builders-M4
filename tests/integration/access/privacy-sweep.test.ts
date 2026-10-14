import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import * as exportPng from "@/app/api/export/route";
import * as groupView from "@/app/api/group/view/route";
import * as showDetail from "@/app/api/shows/[id]/route";
import * as time from "@/app/api/time/route";
import * as users from "@/app/api/users/route";
import { buildExportScene } from "@/export/export-scene";
import { setSelection } from "@/server/selection";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";
import { groupWith } from "../support/groups";
import { importFixture } from "../support/lineup";

withCleanDb();

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

/**
 * Privacy sweep (RNF-04, RNF-05): every content route denies access without a session
 * (AC-98, AC-99, AC-100) and private resources deny authenticated outsiders.
 */
const CONTENT_ROUTES: { name: string; url: string; handler: Handler; params?: Record<string, string> }[] = [
  { name: "GET /api/time", url: "/api/time", handler: time.GET as Handler },
  { name: "GET /api/users", url: "/api/users?q=an", handler: users.GET as Handler },
  { name: "GET /api/export", url: "/api/export?kind=personal&day=2026-11-21&format=1080x1920", handler: exportPng.GET as Handler },
  { name: "GET /api/group/view", url: "/api/group/view?day=2026-11-21", handler: groupView.GET as Handler },
  { name: "GET /api/shows/[id]", url: "/api/shows/s1", handler: showDetail.GET as Handler, params: { id: "s1" } },
];

describe.each(CONTENT_ROUTES)("$name", ({ url, handler, params = {} }) => {
  const call = (token?: string) => handler(requestWithSession(url, token), { params: Promise.resolve(params) });

  it("responds 401 without leaking content when there is no session", async () => {
    const response = await call();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "unauthenticated" });
  });

  it("responds 401 with an unknown or expired session", async () => {
    const user = await createUser();
    const expired = await createSession(user.id, new Date(Date.now() - 1000));

    expect((await call("forged-token")).status).toBe(401);
    expect((await call(expired)).status).toBe(401);
  });
});

describe("route inventory", () => {
  it("covers every API route except the authentication endpoints", () => {
    const apiDir = join(process.cwd(), "src/app/api");
    const routes = (readdirSync(apiDir, { recursive: true }) as string[])
      .filter((file) => file.endsWith("route.ts"))
      .map((file) => `/api/${relative(".", file).replace(/\/?route\.ts$/, "")}`)
      .filter((route) => !route.startsWith("/api/auth"))
      .sort();
    const covered = CONTENT_ROUTES.map((r) => r.name.replace(/^GET /, "")).sort();

    expect(routes).toEqual(covered);
  });
});

describe("authenticated outsiders (RNF-05)", () => {
  async function setup() {
    await importFixture();
    const { owner, members } = await groupWith("ana", ["beto"]);
    await setSelection(owner.id, "s1", true);
    await setSelection(members[0].id, "s1", true);
    const zoe = await createUser("zoe");
    return { ana: owner, zoe, token: await createSession(zoe.id) };
  }

  it("cannot read another group's view: 404 without counts or names (AC-79)", async () => {
    const { token } = await setup();

    const response = await groupView.GET(requestWithSession("/api/group/view?day=2026-11-21", token));
    const text = await response.text();

    expect(response.status).toBe(404);
    expect(text).not.toMatch(/ana|beto|count/);
  });

  it("cannot export another group's PNG (AC-104)", async () => {
    const { token } = await setup();

    const response = await exportPng.GET(requestWithSession("/api/export?kind=group&day=2026-11-21&format=1080x1920&names=1", token));

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("gets a personal export with only their own selections highlighted (AC-101)", async () => {
    const { zoe } = await setup();

    const scene = await buildExportScene(zoe.id, { kind: "personal", day: "2026-11-21", format: "1080x1920", includeNames: false });

    expect(scene!.blocks.filter((b) => b.highlighted)).toEqual([]);
  });

  it("finds other people with nothing but username and avatar (AC-28)", async () => {
    const { token } = await setup();

    const text = await (await users.GET(requestWithSession("/api/users?q=an", token))).text();

    expect(JSON.parse(text)).toEqual([{ username: "ana", avatar: { shape: "circle", color: "violet" } }]);
    expect(text).not.toMatch(/id|email|pin|argon|session/i);
  });
});
