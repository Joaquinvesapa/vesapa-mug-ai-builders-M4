import { describe, expect, it } from "vitest";
import * as showDetail from "@/app/api/shows/[id]/route";
import * as time from "@/app/api/time/route";
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
