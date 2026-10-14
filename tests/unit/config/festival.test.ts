import { describe, expect, it } from "vitest";
import { festival } from "@config/festival";
import { festivalTimeToInstant } from "@/domain/time";

describe("festival config", () => {
  it("describes exactly one festival located in Argentina", () => {
    expect(festival.country).toBe("AR");
    expect(festival.name.trim()).not.toBe("");
  });

  it("uses the fixed Buenos Aires time zone", () => {
    expect(festival.timeZone).toBe("America/Argentina/Buenos_Aires");
  });

  it("lists valid, unique festival days in ascending order", () => {
    expect(festival.days.length).toBeGreaterThan(0);
    for (const day of festival.days) expect(() => festivalTimeToInstant(day, "12:00")).not.toThrow();
    expect([...festival.days].sort()).toEqual(festival.days);
    expect(new Set(festival.days).size).toBe(festival.days.length);
  });
});
