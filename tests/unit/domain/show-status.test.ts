import { describe, expect, it } from "vitest";
import { serverNow, showStatus, STATUS_LABELS } from "@/domain/show-status";

const start = new Date("2026-11-21T23:00:00.000Z");
const end = new Date("2026-11-22T00:00:00.000Z");
const ms = (date: Date, delta: number) => new Date(date.getTime() + delta);

describe("showStatus with exact boundaries", () => {
  it("is upcoming 1 ms before the start (AC-80)", () => {
    expect(showStatus(start, end, ms(start, -1))).toBe("upcoming");
  });

  it("is live exactly at the start (AC-81)", () => {
    expect(showStatus(start, end, start)).toBe("live");
  });

  it("is live 1 ms before the end (AC-82)", () => {
    expect(showStatus(start, end, ms(end, -1))).toBe("live");
  });

  it("is finished exactly at the end (AC-83)", () => {
    expect(showStatus(start, end, end)).toBe("finished");
  });

  it("uses Spanish labels", () => {
    expect(STATUS_LABELS).toEqual({ upcoming: "próximo", live: "en vivo", finished: "finalizado" });
  });
});

describe("serverNow (AC-84)", () => {
  it("derives the instant from the server offset, not from the device clock", () => {
    const serverAtLoad = new Date("2026-11-21T23:30:00Z");
    const deviceAtLoad = new Date("2026-11-21T10:00:00Z");
    const offset = serverAtLoad.getTime() - deviceAtLoad.getTime();

    const later = serverNow(offset, ms(deviceAtLoad, 60_000));

    expect(later).toEqual(ms(serverAtLoad, 60_000));
    expect(showStatus(start, end, later)).toBe("live");
  });
});
