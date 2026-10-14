import { describe, expect, it } from "vitest";
import { festivalDayOf, festivalTimeToInstant, formatFestivalTime } from "@/domain/time";

describe("festivalTimeToInstant", () => {
  it("converts a Buenos Aires local time to its UTC instant (fixed UTC-3)", () => {
    expect(festivalTimeToInstant("2026-11-21", "21:00").toISOString()).toBe("2026-11-22T00:00:00.000Z");
  });

  it("places times before 06:00 on the next calendar day", () => {
    expect(festivalTimeToInstant("2026-11-21", "00:30").toISOString()).toBe("2026-11-22T03:30:00.000Z");
    expect(festivalTimeToInstant("2026-11-21", "05:59").toISOString()).toBe("2026-11-22T08:59:00.000Z");
  });

  it("keeps 06:00 on the same calendar day", () => {
    expect(festivalTimeToInstant("2026-11-21", "06:00").toISOString()).toBe("2026-11-21T09:00:00.000Z");
  });

  it.each([
    ["2026-11-21", "24:00"],
    ["2026-11-21", "7:05"],
    ["2026-11-21", "07:60"],
    ["2026-02-30", "20:00"],
    ["21/11/2026", "20:00"],
  ])("rejects malformed input %s %s", (day, time) => {
    expect(() => festivalTimeToInstant(day, time)).toThrow();
  });
});

describe("formatFestivalTime", () => {
  it("formats an instant as HH:MM in Buenos Aires time", () => {
    expect(formatFestivalTime(new Date("2026-11-22T03:30:00Z"))).toBe("00:30");
    expect(formatFestivalTime(new Date("2026-11-22T00:00:00Z"))).toBe("21:00");
  });
});

describe("festivalDayOf", () => {
  it("returns the festival day, which starts at 06:00 local time", () => {
    expect(festivalDayOf(new Date("2026-11-22T08:59:00Z"))).toBe("2026-11-21");
    expect(festivalDayOf(new Date("2026-11-22T09:00:00Z"))).toBe("2026-11-22");
  });
});
