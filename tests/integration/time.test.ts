import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/time/route";
import { withCleanDb } from "./setup/db";
import { createSession, createUser, requestWithSession } from "./support/factories";

withCleanDb();

describe("GET /api/time", () => {
  it("requires a session", async () => {
    const response = await GET(requestWithSession("/api/time"));

    expect(response.status).toBe(401);
  });

  it("returns the server instant as ISO-8601 UTC", async () => {
    const user = await createUser();
    const token = await createSession(user.id);
    const before = Date.now();

    const response = await GET(requestWithSession("/api/time", token));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.now).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(Date.parse(body.now)).toBeGreaterThanOrEqual(before);
    expect(Date.parse(body.now)).toBeLessThanOrEqual(Date.now());
    expect(response.headers.get("cache-control")).toContain("no-store");
  });
});
