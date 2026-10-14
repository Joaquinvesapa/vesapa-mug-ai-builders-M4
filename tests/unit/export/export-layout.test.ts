import { describe, expect, it } from "vitest";
import { buildDayView } from "@/domain/grid-view";
import { festivalTimeToInstant } from "@/domain/time";
import { EXPORT_FORMATS, layoutExport, type ExportFormat } from "@/export/export-layout";

const DAY = "2026-11-21";
const at = (time: string) => festivalTimeToInstant(DAY, time);
const STAGES = ["Norte", "Sur", "Carpa", "Río", "Patio"].map((name, position) => ({ id: name, name, position }));

/** Widest and longest day: 5 stages from 16:00 to 02:00, including a 15-minute show. */
const SHOWS = [
  { id: "first", artist: "Apertura", description: "", stageId: "Norte", startsAt: at("16:00"), endsAt: at("17:00") },
  { id: "short", artist: "Un nombre de artista muy largo", description: "", stageId: "Sur", startsAt: at("18:00"), endsAt: at("18:15") },
  { id: "hour", artist: "Banda", description: "", stageId: "Carpa", startsAt: at("20:00"), endsAt: at("21:00") },
  { id: "late", artist: "Cierre", description: "", stageId: "Patio", startsAt: at("01:00"), endsAt: at("02:00") },
];
const VIEW = buildDayView(DAY, STAGES, SHOWS);
const FORMATS = Object.keys(EXPORT_FORMATS) as ExportFormat[];

describe.each(FORMATS)("layoutExport %s", (format) => {
  const { width, height } = EXPORT_FORMATS[format];
  const layout = layoutExport(VIEW, format);

  it("uses the exact canvas size (AC-87, AC-88)", () => {
    expect(layout.canvas).toEqual({ width, height });
  });

  it("keeps every column, header and block inside the canvas without cropping (AC-108, FR-071)", () => {
    expect(layout.columns).toHaveLength(5);
    for (const rect of [...layout.columns, ...layout.blocks, layout.grid]) {
      expect(rect.x).toBeGreaterThanOrEqual(0);
      expect(rect.y).toBeGreaterThanOrEqual(0);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width);
      expect(rect.y + rect.height).toBeLessThanOrEqual(height);
    }
    const last = layout.blocks.find((b) => b.showId === "late")!;
    expect(last.y + last.height).toBeCloseTo(layout.grid.y + layout.grid.height, 0);
  });

  it("scales the grid uniformly, preserving its aspect ratio within 1 px (FR-071)", () => {
    const hour = layout.blocks.find((b) => b.showId === "hour")!;
    const appBlock = VIEW.blocks.find((b) => b.showId === "hour")!;
    expect(Math.abs(hour.height - appBlock.height * layout.scale)).toBeLessThan(1);
    expect(Math.abs(layout.columns[0].width - VIEW.columnWidth * layout.scale)).toBeLessThan(1);
  });

  it("never renders text below 20 px for artists and 16 px for times (FR-072)", () => {
    for (const block of layout.blocks) {
      expect(block.artistFontPx).toBeGreaterThanOrEqual(20);
      expect(block.timeFontPx).toBeGreaterThanOrEqual(16);
    }
  });

  it("shows the time on a one-hour block", () => {
    expect(layout.blocks.find((b) => b.showId === "hour")!.showTime).toBe(true);
  });
});

describe("text rule in the smaller format (AC-110)", () => {
  it("omits the time of a 15-minute show and keeps the artist at 20 px for truncation", () => {
    const short = layoutExport(VIEW, "1080x1350").blocks.find((b) => b.showId === "short")!;

    expect(short.showTime).toBe(false);
    expect(short.artistFontPx).toBe(20);
  });
});
