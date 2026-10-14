import { describe, expect, it } from "vitest";
import { isValidPin, isValidUsername, usernameKey } from "@/domain/credentials";

describe("isValidPin (AC-06)", () => {
  it("accepts exactly 6 digits", () => {
    expect(isValidPin("482913")).toBe(true);
    expect(isValidPin("000000")).toBe(true);
  });

  it.each(["48291", "4829130", "48291a", "", " 482913", "４８２９１３"])("rejects %j", (pin) => {
    expect(isValidPin(pin)).toBe(false);
  });
});

describe("isValidUsername (AC-12, AC-13, FR-016)", () => {
  it("accepts 3 and 30 characters of letters, digits, dot and underscore", () => {
    expect(isValidUsername("ana")).toBe(true);
    expect(isValidUsername("a".repeat(30))).toBe(true);
    expect(isValidUsername("Ana_B.2026")).toBe(true);
  });

  it.each(["an", "a".repeat(31), "ana maría", "josé", "ñandú", "ana-b", "ana!", ""])("rejects %j", (name) => {
    expect(isValidUsername(name)).toBe(false);
  });
});

describe("usernameKey", () => {
  it("compares usernames without case (FR-016)", () => {
    expect(usernameKey("aNA")).toBe(usernameKey("Ana"));
  });
});
