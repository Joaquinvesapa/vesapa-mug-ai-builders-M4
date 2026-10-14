import { describe, expect, it } from "vitest";
import { defaultFestivalDay, formatFestivalDay } from "@/domain/festival-days";

const DAYS = ["2026-11-20", "2026-11-21", "2026-11-23"];
const local = (iso: string) => new Date(iso);

describe("defaultFestivalDay (FR-091)", () => {
  it("opens the current festival day during the festival", () => {
    expect(defaultFestivalDay(DAYS, local("2026-11-21T23:00:00Z"))).toBe("2026-11-21");
  });

  it("treats the early morning as the previous festival day", () => {
    expect(defaultFestivalDay(DAYS, local("2026-11-22T05:00:00Z"))).toBe("2026-11-21");
  });

  it("opens the first day before the festival and the last day after it", () => {
    expect(defaultFestivalDay(DAYS, local("2026-10-14T12:00:00Z"))).toBe("2026-11-20");
    expect(defaultFestivalDay(DAYS, local("2026-12-01T12:00:00Z"))).toBe("2026-11-23");
  });

  it("opens the next festival day on a gap day", () => {
    expect(defaultFestivalDay(DAYS, local("2026-11-22T18:00:00Z"))).toBe("2026-11-23");
  });
});

describe("formatFestivalDay", () => {
  it("formats a festival day in Spanish", () => {
    expect(formatFestivalDay("2026-11-21")).toBe("sábado 21 de noviembre");
  });
});
