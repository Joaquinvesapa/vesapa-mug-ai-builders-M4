import { describe, expect, it } from "vitest";
import * as exportPng from "@/app/api/export/route";
import * as groupView from "@/app/api/group/view/route";
import * as showDetail from "@/app/api/shows/[id]/route";
import * as time from "@/app/api/time/route";
import * as users from "@/app/api/users/route";
import { withCleanDb } from "../setup/db";
import { createSession, createUser, requestWithSession } from "../support/factories";

withCleanDb();

type Handler = (request: Request, context: { params: Promise<Record<string, string>> }) => Promise<Response>;

/**
 * Every content route must deny access without a session (AC-98, AC-99, AC-100).
 * Extend this table with each new content route.
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
