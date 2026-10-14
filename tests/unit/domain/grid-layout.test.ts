import { describe, expect, it } from "vitest";
import { blockText, layoutDay, MINUTE_HEIGHT_PX, type GridShow, type GridStage } from "@/domain/grid-layout";
import { festivalTimeToInstant } from "@/domain/time";

const DAY = "2026-11-21";
const stages: GridStage[] = [
  { id: "sur", name: "Sur", position: 1 },
  { id: "norte", name: "Norte", position: 0 },
  { id: "carpa", name: "Carpa", position: 2 },
];

function show(id: string, stageId: string, start: string, end: string): GridShow {
  return { id, artist: id, stageId, startsAt: festivalTimeToInstant(DAY, start), endsAt: festivalTimeToInstant(DAY, end) };
}

describe("layoutDay", () => {
  it("creates one column per stage in order of appearance with its color (FR-031, FR-032)", () => {
    const layout = layoutDay(stages, []);

    expect(layout.columns.map((c) => c.name)).toEqual(["Norte", "Sur", "Carpa"]);
    expect(layout.columns.map((c) => c.color.name)).toEqual(["violet", "fuchsia", "amber"]);
  });

  it("spans the axis from the first start to the last end of the day (FR-031)", () => {
    const layout = layoutDay(stages, [show("a", "norte", "18:00", "19:00"), show("b", "sur", "20:15", "21:45")]);

    expect(layout.axisStart).toEqual(festivalTimeToInstant(DAY, "18:00"));
    expect(layout.axisEnd).toEqual(festivalTimeToInstant(DAY, "21:45"));
    expect(layout.height).toBe(225 * MINUTE_HEIGHT_PX);
  });

  it("places a block in its stage column at its start, with height proportional to duration (AC-34)", () => {
    const layout = layoutDay(stages, [show("long", "sur", "18:00", "19:00"), show("short", "norte", "18:00", "18:30")]);
    const long = layout.blocks.find((b) => b.showId === "long")!;
    const short = layout.blocks.find((b) => b.showId === "short")!;

    expect(long.column).toBe(1);
    expect(short.column).toBe(0);
    expect(long.top).toBe(0);
    expect(short.top).toBe(0);
    expect(long.height).toBe(2 * short.height);
  });

  it("uses the same minute scale for every block and column (FR-033)", () => {
    const layout = layoutDay(stages, [show("a", "norte", "18:00", "18:45"), show("b", "carpa", "19:30", "20:15")]);
    const b = layout.blocks.find((x) => x.showId === "b")!;

    expect(b.top).toBe(90 * MINUTE_HEIGHT_PX);
    expect(b.height).toBe(45 * MINUTE_HEIGHT_PX);
  });

  it("places an after-midnight show at the end of the axis (AC-107)", () => {
    const layout = layoutDay(stages, [show("late", "carpa", "00:30", "01:30"), show("early", "norte", "22:00", "23:00")]);
    const late = layout.blocks.find((b) => b.showId === "late")!;

    expect(late.top).toBe(150 * MINUTE_HEIGHT_PX);
    expect(late.top + late.height).toBe(layout.height);
  });

  it("marks whole hours on the axis with local time labels", () => {
    const layout = layoutDay(stages, [show("a", "norte", "23:30", "01:15")]);

    expect(layout.hourMarks.map((m) => m.label)).toEqual(["00:00", "01:00"]);
    expect(layout.hourMarks[0].top).toBe(30 * MINUTE_HEIGHT_PX);
  });

  it("returns an empty layout for a day without shows (FR-090)", () => {
    const layout = layoutDay(stages, []);

    expect(layout.blocks).toEqual([]);
    expect(layout.height).toBe(0);
    expect(layout.isEmpty).toBe(true);
  });
});

describe("blockText (FR-033, FR-072)", () => {
  const lines = { artistLine: 20, timeLine: 16, padding: 4 };

  it("shows artist and time when both fit", () => {
    expect(blockText(44, lines)).toEqual({ showArtist: true, showTime: true });
  });

  it("omits the time first when there is no room", () => {
    expect(blockText(43, lines)).toEqual({ showArtist: true, showTime: false });
    expect(blockText(28, lines)).toEqual({ showArtist: true, showTime: false });
  });

  it("keeps the artist even in the shortest block; truncation is left to the renderer", () => {
    expect(blockText(10, lines)).toEqual({ showArtist: true, showTime: false });
  });
});
