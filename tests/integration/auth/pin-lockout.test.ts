import { describe, expect, it } from "vitest";
import { loginWithPin } from "@/server/auth/pin-service";
import { withCleanDb } from "../setup/db";

withCleanDb();

const PIN = "482913";
const WRONG = "111111";
const start = new Date("2026-11-21T20:00:00Z");
const at = (ms: number) => new Date(start.getTime() + ms);
const MINUTE = 60_000;

async function failTimes(times: number, when = start) {
  for (let i = 0; i < times; i++) await loginWithPin({ username: "ana", pin: WRONG }, when);
}

describe("PIN lockout", () => {
  it("accepts the correct PIN after 4 consecutive failures (AC-15)", async () => {
    await loginWithPin({ username: "ana", pin: PIN }, start);
    await failTimes(4);

    expect((await loginWithPin({ username: "ana", pin: PIN }, start)).status).toBe("ok");
  });

  it("rejects even the correct PIN until 15 minutes after the fifth failure (AC-16)", async () => {
    await loginWithPin({ username: "ana", pin: PIN }, start);
    await failTimes(5);

    expect((await loginWithPin({ username: "ana", pin: PIN }, at(15 * MINUTE - 1))).status).toBe("invalid_credentials");
  });

  it("accepts the correct PIN exactly 15:00 after the fifth failure (AC-17)", async () => {
    await loginWithPin({ username: "ana", pin: PIN }, start);
    await failTimes(5);

    expect((await loginWithPin({ username: "ana", pin: PIN }, at(15 * MINUTE))).status).toBe("ok");
  });

  it("restarts the count after a successful sign-in (AC-18)", async () => {
    await loginWithPin({ username: "ana", pin: PIN }, start);
    await failTimes(4);
    await loginWithPin({ username: "ana", pin: PIN }, start);
    await failTimes(4);

    expect((await loginWithPin({ username: "ana", pin: PIN }, start)).status).toBe("ok");
  });

  it("answers a locked user exactly like a wrong PIN (AC-19)", async () => {
    await loginWithPin({ username: "ana", pin: PIN }, start);
    await loginWithPin({ username: "bea", pin: PIN }, start);
    await failTimes(5);

    const locked = await loginWithPin({ username: "ana", pin: PIN }, at(MINUTE));
    const wrong = await loginWithPin({ username: "bea", pin: WRONG }, at(MINUTE));

    expect(locked).toEqual(wrong);
    expect(locked).toEqual({ status: "invalid_credentials" });
  });

  it("counts concurrent failures without losing any", async () => {
    await loginWithPin({ username: "ana", pin: PIN }, start);
    await Promise.all(Array.from({ length: 5 }, () => loginWithPin({ username: "ana", pin: WRONG }, start)));

    expect((await loginWithPin({ username: "ana", pin: PIN }, at(MINUTE))).status).toBe("invalid_credentials");
  });
});
